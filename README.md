# worktree-tools

Fast git worktree management with great DX.

```bash
# Create a worktree, install deps, and jump in
ga feature-login

# Done? Remove it and the branch
gd
```

## Why?

Git worktrees let you work on multiple branches simultaneously without stashing or committing WIP. But the commands are verbose:

```bash
# Without worktree-tools
git worktree add -b feature-login ../my-app--feature-login
cd ../my-app--feature-login
bun install
cd src/components  # if you were in a subfolder

# With worktree-tools
ga feature-login
```

**worktree-tools** wraps this into two simple commands with:

- Automatic `bun install` after creation
- Subfolder preservation (stay in `src/components` across worktrees)
- Clean progress spinners
- Safe deletion with confirmation

## Installation

```bash
# npm
npm install -g worktree-tools

# bun
bun install -g worktree-tools
```

### Shell Integration

Since CLIs can't change your shell's directory, add these functions:

**Bash / Zsh** (`~/.bashrc` or `~/.zshrc`):

```bash
ga() { eval "$(command ga "$@")"; }
gd() { eval "$(command gd "$@")"; }
```

**Fish** (`~/.config/fish/config.fish`):

```fish
function ga; eval (command ga $argv); end
function gd; eval (command gd $argv); end
```

## Commands

### `ga <branch-name>`

Creates a new worktree with a new branch and sets it up.

```bash
# Basic usage
ga feature-login
# Creates ../my-app--feature-login with branch 'feature-login'

# Branch with slashes (sanitized for directory name)
ga feat/auth
# Creates ../my-app--feat-auth with branch 'feat/auth'

# From a specific base branch
ga feature-login --base main
```

**What it does:**

1. Creates worktree at `../<repo>--<branch>`
2. Runs `bun install`
3. If you're in a subfolder, navigates to the same subfolder in the new worktree

**Flags:**

| Flag | Description |
|------|-------------|
| `--no-install` | Skip `bun install` |
| `--base <ref>` | Create from specific branch/commit (default: HEAD) |

### `gd`

Removes the current worktree and deletes its branch.

```bash
# In my-app--feature-login
gd
# Prompts for confirmation, then:
# - Removes the worktree
# - Deletes the branch
# - Returns you to the main repo
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--force`, `-f` | Skip confirmation |
| `--keep-branch` | Remove worktree but keep the branch |

## Naming Convention

Worktrees are created next to your repo with `--` separating repo and branch:

```
projects/
├── my-app/                    # Main repo
├── my-app--feature-login/     # Worktree for feature-login
├── my-app--feat-auth/         # Worktree for feat/auth
└── my-app--bugfix-header/     # Worktree for bugfix-header
```

## Requirements

- Git 2.5+ (worktree support)
- Bun (for `bun install`)

## License

MIT
