import ora, { type Ora } from "ora";
import pc from "picocolors";
import { confirm } from "@inquirer/prompts";

/**
 * Create and start a spinner
 */
export function spinner(text: string): Ora {
  return ora({
    text,
    stream: process.stderr,
  }).start();
}

/**
 * Log a success message to stderr
 */
export function success(message: string): void {
  console.error(pc.green("✔") + " " + message);
}

/**
 * Log an error message to stderr
 */
export function error(message: string): void {
  console.error(pc.red("✖") + " " + message);
}

/**
 * Log a warning message to stderr
 */
export function warn(message: string): void {
  console.error(pc.yellow("⚠") + " " + message);
}

/**
 * Log an info message to stderr
 */
export function info(message: string): void {
  console.error(pc.blue("ℹ") + " " + message);
}

/**
 * Prompt for confirmation
 */
export async function confirmPrompt(message: string): Promise<boolean> {
  return await confirm({
    message,
    default: false,
  });
}

/**
 * Exit with an error message
 */
export function exitWithError(message: string): never {
  error(message);
  process.exit(1);
}
