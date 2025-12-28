import * as path from "path";
import {
  isGitRepo,
  getCurrentWorktree,
  listWorktrees,
  removeWorktree,
  deleteBranch,
  getMainWorktreePath,
} from "../utils/git.ts";
import { spinner, success, exitWithError, confirmPrompt } from "../utils/ui.ts";
import { outputCdCommand } from "../utils/shell.ts";

export interface GdOptions {
  force: boolean;
  keepBranch: boolean;
}

export async function gd(options: GdOptions): Promise<void> {
  const { force, keepBranch } = options;

  // Check if we're in a git repo
  if (!(await isGitRepo())) {
    exitWithError("Not inside a git repository");
  }

  // Get current worktree info
  const currentWorktree = await getCurrentWorktree();
  if (!currentWorktree) {
    exitWithError("Could not determine current worktree");
  }

  const worktrees = await listWorktrees();

  // Check if this is the main worktree (not a linked worktree)
  const isMainWorktree = worktrees[0]?.path === currentWorktree.path;
  if (isMainWorktree) {
    exitWithError(
      "Cannot delete the main worktree. Use 'gd' from a linked worktree directory."
    );
  }

  // Check directory name pattern
  const dirName = path.basename(currentWorktree.path);
  if (!dirName.includes("--")) {
    exitWithError(
      `Not in a worktree directory (expected '<repo>--<branch>' format, got '${dirName}')`
    );
  }

  const branch = currentWorktree.branch;
  if (!branch) {
    exitWithError("Could not determine branch name for current worktree");
  }

  // Confirm deletion
  if (!force) {
    const confirmed = await confirmPrompt(
      `Remove worktree and branch '${branch}'?`
    );
    if (!confirmed) {
      console.error("Cancelled.");
      process.exit(0);
    }
  }

  // Get the main worktree path before removing current worktree
  const mainPath = await getMainWorktreePath();

  // Remove the worktree
  const removeSpinner = spinner(`Removing worktree '${dirName}'`);
  try {
    await removeWorktree(currentWorktree.path);
    removeSpinner.succeed(`Removed worktree '${dirName}'`);
  } catch (e) {
    removeSpinner.fail(`Failed to remove worktree`);
    const message = e instanceof Error ? e.message : String(e);
    exitWithError(message);
  }

  // Delete the branch (from main worktree to avoid cwd issues)
  if (!keepBranch) {
    const branchSpinner = spinner(`Deleting branch '${branch}'`);
    try {
      await deleteBranch(branch, mainPath);
      branchSpinner.succeed(`Deleted branch '${branch}'`);
    } catch (e: unknown) {
      branchSpinner.fail(`Failed to delete branch '${branch}'`);
      // Don't exit - worktree is already removed
      if (e instanceof Error) {
        console.error(`  ${e.message}`);
      }
    }
  }

  // Output navigation info
  console.error("");
  console.error("Run:");
  console.error(`  cd ${mainPath}`);
  console.error("");

  // Output cd command to stdout for shell integration
  outputCdCommand(mainPath);
}

export function parseGdArgs(args: string[]): GdOptions {
  let force = false;
  let keepBranch = false;

  for (const arg of args) {
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--keep-branch") {
      keepBranch = true;
    } else if (arg === "-h" || arg === "--help") {
      printGdHelp();
      process.exit(0);
    } else if (arg?.startsWith("-")) {
      exitWithError(`Unknown option: ${arg}`);
    }
  }

  return { force, keepBranch };
}

function printGdHelp(): void {
  console.error(`
Usage: gd [options]

Removes the current worktree and deletes its associated branch.

Options:
  --force, -f       Skip confirmation prompt
  --keep-branch     Remove worktree but keep the branch
  -h, --help        Show this help message

Examples:
  gd                Interactive confirmation before deletion
  gd --force        Skip confirmation
  gd --keep-branch  Keep the branch after removing worktree
`);
}
