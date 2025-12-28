import { $ } from "bun";

export interface WorktreeInfo {
  path: string;
  head: string;
  branch: string | null;
}

/**
 * Check if we're inside a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    await $`git rev-parse --git-dir`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the root directory of the git repository
 */
export async function getRepoRoot(): Promise<string> {
  const result = await $`git rev-parse --show-toplevel`.quiet();
  return result.text().trim();
}

/**
 * Get the name of the repository (directory name)
 */
export async function getRepoName(): Promise<string> {
  const root = await getRepoRoot();
  return root.split("/").pop() || root;
}

/**
 * Get current working directory relative to repo root
 */
export async function getRelativeCwd(): Promise<string> {
  const result = await $`git rev-parse --show-prefix`.quiet();
  return result.text().trim();
}

/**
 * Check if a branch exists
 */
export async function branchExists(branch: string): Promise<boolean> {
  try {
    await $`git rev-parse --verify refs/heads/${branch}`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize branch name for directory name (replace / with -)
 */
export function sanitizeBranchForDir(branch: string): string {
  return branch.replace(/\//g, "-");
}

/**
 * List all worktrees
 */
export async function listWorktrees(): Promise<WorktreeInfo[]> {
  const result = await $`git worktree list --porcelain`.quiet();
  const lines = result.text().trim().split("\n");
  const worktrees: WorktreeInfo[] = [];

  let current: Partial<WorktreeInfo> = {};
  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      if (current.path) {
        worktrees.push(current as WorktreeInfo);
      }
      current = { path: line.slice(9), branch: null };
    } else if (line.startsWith("HEAD ")) {
      current.head = line.slice(5);
    } else if (line.startsWith("branch ")) {
      // Extract branch name from refs/heads/...
      current.branch = line.slice(7).replace("refs/heads/", "");
    } else if (line === "") {
      if (current.path) {
        worktrees.push(current as WorktreeInfo);
        current = {};
      }
    }
  }
  if (current.path) {
    worktrees.push(current as WorktreeInfo);
  }

  return worktrees;
}

/**
 * Get worktree info for current directory
 */
export async function getCurrentWorktree(): Promise<WorktreeInfo | null> {
  const cwd = process.cwd();
  const worktrees = await listWorktrees();

  // Find worktree that contains our cwd
  for (const wt of worktrees) {
    if (cwd === wt.path || cwd.startsWith(wt.path + "/")) {
      return wt;
    }
  }
  return null;
}

/**
 * Create a new worktree with a new branch
 */
export async function createWorktree(
  path: string,
  branch: string,
  baseBranch?: string
): Promise<void> {
  if (baseBranch) {
    await $`git worktree add -b ${branch} ${path} ${baseBranch}`.quiet();
  } else {
    await $`git worktree add -b ${branch} ${path}`.quiet();
  }
}

/**
 * Remove a worktree
 */
export async function removeWorktree(path: string): Promise<void> {
  await $`git worktree remove ${path} --force`.quiet();
}

/**
 * Delete a branch (runs from main worktree to avoid cwd issues)
 */
export async function deleteBranch(branch: string, mainPath?: string): Promise<void> {
  // Use Bun.spawn with explicit cwd to avoid issues when cwd doesn't exist
  const cwd = mainPath || process.cwd();
  const proc = Bun.spawn(["git", "branch", "-D", branch], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(stderr.trim() || `Failed to delete branch ${branch}`);
  }
}

/**
 * Check if a path exists (file or directory)
 */
export async function pathExists(pathStr: string): Promise<boolean> {
  try {
    const stat = await Bun.file(pathStr.replace(/\/$/, "")).exists();
    if (stat) return true;
    // Try as directory
    const result = await $`test -e ${pathStr}`.nothrow();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get the main worktree path (the original repo, not a linked worktree)
 */
export async function getMainWorktreePath(): Promise<string> {
  const worktrees = await listWorktrees();
  // The first worktree is always the main one
  if (worktrees.length > 0 && worktrees[0]) {
    return worktrees[0].path;
  }
  return await getRepoRoot();
}
