export function seekUnusedNumericId<T>(map: Map<number, T>) {
  let i = 0;
  while (map.has(i)) {
    i++;
  }
  return i;
}

export function findNextId(data: Map<string, any>, prefix: string = ""): string {
  let id = 0;
  while (Object.keys(data).indexOf(`${prefix}${id}`) !== -1) {
    id++;
  }
  return `${prefix}${id}`;
}
