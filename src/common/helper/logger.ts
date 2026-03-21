export function logger(text: string) {
  console.log(`=====> ${text}`);
}

export function loggerError(text: string) {
  console.error(`🛑 ${text}`);
}

export function loggerWarning(text: string) {
  console.error(`⚠️ ${text}`);
}
