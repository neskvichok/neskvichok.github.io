export function getBasePath(): string {
  if (typeof window !== 'undefined') {
    // Client-side: check if we're on GitHub Pages
    const hostname = window.location.hostname;
    if (hostname === 'neskvichok.github.io') {
      return '/neskvichok.github.io';
    }
  }
  return '';
}

export function withBasePath(path: string): string {
  return getBasePath() + path;
}
