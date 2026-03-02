export function sanitizeText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/\s*\r?\n+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
