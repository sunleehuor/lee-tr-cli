type FlatItem = {
  path: string[];
  value: string;
};

export function flattenObject(obj: Record<string, any>, path: string[] = [], result: FlatItem[] = []): FlatItem[] {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key];

    if (typeof value === 'string') {
      result.push({
        path: currentPath,
        value,
      });
    } else if (value && typeof value === 'object') {
      flattenObject(value, currentPath, result);
    }
  }

  return result;
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }

  return chunks;
}

export function setValue(obj: Record<string, any>, path: string[], value: any) {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] ??= {};
    current = current[path[i]];
  }

  current[path[path.length - 1]] = value;
}

export function unFlattenObject(flat: FlatItem[][]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const batch of flat) {
    for (const { path, value } of batch) {
      let current = result;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];

        if (!(key in current)) {
          current[key] = {};
        }

        current = current[key];
      }

      current[path[path.length - 1]] = value;
    }
  }

  return result;
}