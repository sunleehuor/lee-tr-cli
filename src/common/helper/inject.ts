export async function getClipBoardy() {
  const mod = await import("clipboardy");
  return mod.default;
}