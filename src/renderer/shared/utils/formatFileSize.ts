/** Human-readable file size, e.g. 1536 -> "1.5 KB". */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${index === 0 ? value : value.toFixed(1)} ${units[index]}`;
}
