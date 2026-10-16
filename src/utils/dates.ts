export function dateInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function monthKey(date = new Date()): string {
  return dateInput(date).slice(0, 7);
}
export function monthLabel(key: string): string {
  return new Date(`${key}-01T12:00`).toLocaleDateString('pt-MZ', {
    month: 'long',
    year: 'numeric',
  });
}
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short' });
}
