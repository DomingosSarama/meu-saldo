import { z } from 'zod';
import { validateSnapshot, snapshotSchema, type Snapshot } from '../models/finance';
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const envelope = z
  .object({
    app: z.literal('MeuSaldo'),
    version: z.literal(1),
    exportedAt: z.iso.datetime({ offset: true }),
    data: snapshotSchema,
  })
  .strict();
export type Backup = z.infer<typeof envelope>;
export function createBackup(data: Snapshot): string {
  return JSON.stringify(
    {
      app: 'MeuSaldo',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: validateSnapshot(data),
    },
    null,
    2,
  );
}
export function parseBackup(text: string): Backup {
  if (new Blob([text]).size > MAX_BACKUP_BYTES)
    throw new Error('O backup excede o limite de 20 MB.');
  try {
    const parsed = envelope.parse(JSON.parse(text));
    validateSnapshot(parsed.data);
    return parsed;
  } catch {
    throw new Error(
      'Backup inválido ou incompatível. Usa um ficheiro JSON do MeuSaldo, versão 1. Os dados actuais não foram alterados.',
    );
  }
}
function csvCell(value: string) {
  // Prevent spreadsheet formula injection, including prefixed whitespace/control chars.
  // eslint-disable-next-line no-control-regex -- Spreadsheet parsers ignore leading control characters.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function exportCSV(s: Snapshot): string {
  const header = [
    'Data',
    'Tipo',
    'Valor (MT)',
    'Carteira',
    'Destino',
    'Categoria',
    'Subcategoria',
    'Descrição',
    'Pagamento',
    'Observações',
  ];
  const rows = s.movements
    .slice()
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((m) => [
      m.occurredAt,
      { income: 'Receita', expense: 'Despesa', transfer: 'Transferência' }[m.kind],
      (m.amount / 100).toFixed(2),
      s.wallets.find((w) => w.id === m.walletId)?.name ?? '',
      s.wallets.find((w) => w.id === m.toWalletId)?.name ?? '',
      s.categories.find((c) => c.id === m.categoryId)?.name ?? '',
      m.subcategory ?? '',
      m.description,
      m.paymentMethod,
      m.notes,
    ]);
  return '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}
export async function saveFile(content: string, name: string, type: string) {
  const file = new File([content], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'MeuSaldo' });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError')
        throw new Error('Exportação cancelada.', { cause: error });
    }
  }
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
