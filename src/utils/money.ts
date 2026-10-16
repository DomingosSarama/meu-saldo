import { MAX_MINOR } from '../models/finance';
export function parseMoney(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(normalized))
    throw new Error('Introduz um valor válido, com até duas casas decimais (ex.: 250,50).');
  const [whole, decimals = ''] = normalized.split('.');
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result > MAX_MINOR)
    throw new Error('O valor excede o limite permitido.');
  return result;
}
export function money(value: number): string {
  return `${new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)} MT`;
}
export function moneyInput(value: number) {
  return (value / 100).toFixed(2);
}
