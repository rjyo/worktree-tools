import * as path from "path";
import { ga, parseGaArgs } from "./commands/ga.ts";
import { gd, parseGdArgs } from "./commands/gd.ts";

// Get which command was invoked based on the script name
const scriptPath = process.argv[1] || "";
const scriptName = path.basename(scriptPath);

// Remove extension if present (for bun)
const command = scriptName.replace(/\.(ts|js)$/, "");

// Get args (skip bun and script path)
const args = process.argv.slice(2);

async function main() {
  if (command === "ga" || scriptPath.endsWith("/ga")) {
    const options = parseGaArgs(args);
    await ga(options);
  } else if (command === "gd" || scriptPath.endsWith("/gd")) {
    const options = parseGdArgs(args);
    await gd(options);
  } else {
    // If called directly with a subcommand as first arg
    const subcommand = args[0];
    const subArgs = args.slice(1);

    if (subcommand === "ga") {
      const options = parseGaArgs(subArgs);
      await ga(options);
    } else if (subcommand === "gd") {
      const options = parseGdArgs(subArgs);
      await gd(options);
    } else {
      console.error(`Usage: ga <branch-name> | gd [options]

Commands:
  ga <branch>   Create a new worktree with a new branch
  gd            Remove current worktree and delete its branch

Run 'ga --help' or 'gd --help' for more information.`);
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
