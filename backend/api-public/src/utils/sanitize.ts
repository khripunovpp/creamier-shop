export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

export function sanitize(value: string): string {
  return stripHtml(value).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
}