# worktree-tools

CLI tools for streamlined git worktree management with great DX.

## Installation

```bash
npm install -g worktree-tools
# or
bun install -g worktree-tools
```

## Commands

### `ga <branch-name>` - Add Worktree

Creates a new git worktree with a new branch, runs setup, and navigates into it.

#### Behavior

1. **Parse current location**
   - Detect if inside a git repository
   - Capture current working directory relative to repo root (e.g., `src/components`)
   - Get the repo root directory name (e.g., `my-project`)

2. **Create worktree**
   - Sanitize branch name for directory: replace `/` with `-` (e.g., `feat/abc` → `feat-abc`)
   - New worktree path: `../<repo-name>--<sanitized-branch>`
   - Create with new branch (original name): `git worktree add -b <branch> <path>`

3. **Post-creation setup**
   - Run `bun install` in the new worktree root (with spinner/progress)

4. **Navigate to worktree**
   - If user was in a subfolder (e.g., `src/components`), cd to the same subfolder in the new worktree
   - Output the `cd` command for shell integration (since child processes can't change parent's cwd)

#### Example

```bash
# In /projects/my-app/src/components
$ ga feature-login

✔ Creating worktree 'my-app--feature-login'
✔ Installing dependencies (bun install)

Worktree ready! Run:
  cd /projects/my-app--feature-login/src/components
```

#### Flags

| Flag | Description |
|------|-------------|
| `--no-install` | Skip `bun install` |
| `--base <branch>` | Create worktree from specific branch/commit (default: current HEAD) |

---

### `gd` - Delete Worktree

Removes the current worktree and deletes its associated branch.

#### Behavior

1. **Validate location**
   - Check if current directory matches `<repo>--<branch>` naming pattern
   - Use `git worktree list` to get the actual branch name (handles sanitized dir names like `feat-abc` → `feat/abc`)
   - Error if not in a worktree directory

2. **Confirm deletion**
   - Interactive prompt: "Remove worktree and branch '<branch>'?"
   - Skip with `--force` flag

3. **Remove worktree**
   - `git worktree remove <worktree> --force`
   - `git branch -D <branch>`

4. **Navigate to main repo**
   - Output `cd` command to return to main repo

#### Example

```bash
# In /projects/my-app--feature-login
$ gd

? Remove worktree and branch 'feature-login'? (y/N) y

✔ Removed worktree 'my-app--feature-login'
✔ Deleted branch 'feature-login'

Run:
  cd /projects/my-app
```

#### Flags

| Flag | Description |
|------|-------------|
| `--force`, `-f` | Skip confirmation prompt |
| `--keep-branch` | Remove worktree but keep the branch |

---

## Shell Integration

Since a child process cannot change the parent shell's directory, worktree-tools outputs shell commands to execute. For seamless DX, add shell functions:

### Bash / Zsh

```bash
# ~/.bashrc or ~/.zshrc
ga() { eval "$(command ga "$@")" }
gd() { eval "$(command gd "$@")" }
```

### Fish

```fish
# ~/.config/fish/functions/ga.fish
function ga
    eval (command ga $argv)
end

# ~/.config/fish/functions/gd.fish
function gd
    eval (command gd $argv)
end
```

---

## Output Format

The CLI outputs **two types of content**:

1. **Stderr**: Progress messages, spinners, errors (for human consumption)
2. **Stdout**: Shell commands to execute (for shell integration)

This allows:
- `ga feature-x` alone shows progress and prints the cd command
- `eval "$(ga feature-x)"` shows progress and auto-cds

---

## DX Features

- **Spinners** for long operations (worktree creation, bun install)
- **Colored output** (success ✔ in green, errors ✖ in red)
- **Clear error messages** with suggested fixes
- **Graceful degradation** (continues with warning if bun install fails)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Not in a git repo | Error: "Not inside a git repository" |
| Branch already exists | Error: "Branch '<name>' already exists" |
| Worktree path exists | Error: "Directory '<path>' already exists" |
| `gd` outside worktree dir | Error: "Not in a worktree directory (expected '<repo>--<branch>' format)" |
| `bun install` fails | Warning, continue (worktree still created) |
| Subfolder doesn't exist in new worktree | Warning, cd to worktree root instead |

---

## Tech Stack

- **Runtime**: Bun
- **CLI Framework**: Native `process.argv` parsing (keep it simple)
- **Spinners/Colors**: `ora` + `chalk` (or `picocolors` for lighter weight)
- **Prompts**: `@inquirer/prompts` or `prompts`

---

## Package Structure

```
worktree-tools/
├── src/
│   ├── cli.ts          # Entry point, argument parsing
│   ├── commands/
│   │   ├── ga.ts       # Add worktree command
│   │   └── gd.ts       # Delete worktree command
│   ├── utils/
│   │   ├── git.ts      # Git operations
│   │   ├── shell.ts    # Shell command output
│   │   └── ui.ts       # Spinners, colors, prompts
│   └── index.ts        # Exports for programmatic use
├── bin/
│   ├── ga              # #!/usr/bin/env bun
│   └── gd              # #!/usr/bin/env bun
├── package.json
├── tsconfig.json
└── README.md
```

---

## package.json (key fields)

```json
{
  "name": "worktree-tools",
  "version": "0.1.0",
  "bin": {
    "ga": "./bin/ga",
    "gd": "./bin/gd"
  },
  "type": "module",
  "files": ["dist", "bin"]
}
```
