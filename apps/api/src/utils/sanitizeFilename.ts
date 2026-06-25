export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/[/\\]/g, '_').replace(/[\x00-\x1f]/g, '');
  const MAX_LENGTH = 200;
  if (base.length > MAX_LENGTH) {
    const ext = base.split('.').pop();
    return `${base.slice(0, MAX_LENGTH - (ext?.length ?? 0) - 1)}.${ext}`;
  }

  return base;
}