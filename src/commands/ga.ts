import { $ } from "bun";
import * as path from "path";
import {
  isGitRepo,
  getRepoRoot,
  getRepoName,
  getRelativeCwd,
  branchExists,
  sanitizeBranchForDir,
  createWorktree,
  pathExists,
} from "../utils/git.ts";
import { spinner, success, warn, exitWithError } from "../utils/ui.ts";
import { outputCdCommand } from "../utils/shell.ts";

export interface GaOptions {
  branch: string;
  noInstall: boolean;
  base?: string;
}

export async function ga(options: GaOptions): Promise<void> {
  const { branch, noInstall, base } = options;

  // Check if we're in a git repo
  if (!(await isGitRepo())) {
    exitWithError("Not inside a git repository");
  }

  // Check if branch already exists
  if (await branchExists(branch)) {
    exitWithError(`Branch '${branch}' already exists`);
  }

  // Get repo info
  const repoRoot = await getRepoRoot();
  const repoName = await getRepoName();
  const relativeCwd = await getRelativeCwd();

  // Calculate worktree path
  const sanitizedBranch = sanitizeBranchForDir(branch);
  const worktreeDirName = `${repoName}--${sanitizedBranch}`;
  const worktreePath = path.join(path.dirname(repoRoot), worktreeDirName);

  // Check if worktree path already exists
  if (await pathExists(worktreePath)) {
    exitWithError(`Directory '${worktreePath}' already exists`);
  }

  // Create the worktree
  const createSpinner = spinner(`Creating worktree '${worktreeDirName}'`);
  try {
    await createWorktree(worktreePath, branch, base);
    createSpinner.succeed(`Created worktree '${worktreeDirName}'`);
  } catch (e) {
    createSpinner.fail(`Failed to create worktree`);
    const message = e instanceof Error ? e.message : String(e);
    exitWithError(message);
  }

  // Run bun install
  if (!noInstall) {
    const installSpinner = spinner("Installing dependencies (bun install)");
    try {
      await $`bun install`.cwd(worktreePath).quiet();
      installSpinner.succeed("Installed dependencies");
    } catch {
      installSpinner.warn("Failed to install dependencies (continuing anyway)");
    }
  }

  // Calculate target directory
  let targetPath = worktreePath;
  if (relativeCwd) {
    const subfolderPath = path.join(worktreePath, relativeCwd);
    if (await pathExists(subfolderPath)) {
      targetPath = subfolderPath;
    } else {
      warn(`Subfolder '${relativeCwd}' doesn't exist in new worktree, navigating to root`);
    }
  }

  // Output navigation info
  console.error("");
  console.error("Worktree ready! Run:");
  console.error(`  cd ${targetPath}`);
  console.error("");

  // Output cd command to stdout for shell integration
  outputCdCommand(targetPath);
}

export function parseGaArgs(args: string[]): GaOptions {
  let branch: string | undefined;
  let noInstall = false;
  let base: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--no-install") {
      noInstall = true;
    } else if (arg === "--base") {
      base = args[++i];
      if (!base) {
        exitWithError("--base requires a branch name");
      }
    } else if (arg?.startsWith("--base=")) {
      base = arg.slice(7);
    } else if (arg === "-h" || arg === "--help") {
      printGaHelp();
      process.exit(0);
    } else if (!arg?.startsWith("-")) {
      branch = arg;
    } else {
      exitWithError(`Unknown option: ${arg}`);
    }
  }

  if (!branch) {
    exitWithError("Branch name required. Usage: ga <branch-name>");
  }

  return { branch, noInstall, base };
}

function printGaHelp(): void {
  console.error(`
Usage: ga <branch-name> [options]

Creates a new git worktree with a new branch.

Options:
  --no-install      Skip running 'bun install'
  --base <branch>   Create worktree from specific branch/commit (default: current HEAD)
  -h, --help        Show this help message

Examples:
  ga feature-login           Create worktree with branch 'feature-login'
  ga feat/new-ui             Creates directory 'repo--feat-new-ui'
  ga fix-bug --no-install    Skip dependency installation
  ga feature --base main     Branch off from main
`);
}
