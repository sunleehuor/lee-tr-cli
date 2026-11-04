/**
 * Retrieves the value of a command-line argument passed in the format `--key=value`.
 *
 * @param command - The argument flag to search for (e.g. '--filePath').
 * @returns The parsed value string, or undefined if not provided.
 */
export function getValueOfCommand(command: string): string | undefined {
  const commands = process.argv;
  for (const com of commands || []) {
    const [keys, value] = com?.split?.('=');
    if (keys === command) {
      return value;
    }
  }
  return undefined;
}
