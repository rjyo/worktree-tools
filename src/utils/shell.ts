/**
 * Output a cd command to stdout for shell integration.
 * The calling shell function should eval this output to change directory.
 */
export function outputCdCommand(path: string): void {
  // Escape special characters in path for shell
  const escaped = path.replace(/'/g, "'\\''");
  console.log(`cd '${escaped}'`);
}
