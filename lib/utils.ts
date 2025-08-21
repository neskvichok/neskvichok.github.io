export function getBasePath(): string {
  // For neskvichok.github.io repository, no base path is needed
  return '';
}

export function withBasePath(path: string): string {
  return path;
}
