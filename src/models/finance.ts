import { z } from 'zod';

// Money is always stored as integer centavos. Limit keeps aggregate maths exact.
export const MAX_MINOR = 9_000_000_000_000;
const id = z.string().min(1).max(100);
const name = z.string().trim().min(1, 'Introduz um nome.').max(80);
const money = z.number().int().min(0).max(MAX_MINOR);
const date = z.iso.datetime({ offset: true });
export const icons = [
  'utensils',
  'car',
  'home',
  'zap',
  'phone',
  'book',
  'heart',
  'bag',
  'coffee',
  'gift',
  'repeat',
  'receipt',
  'grid',
  'briefcase',
  'wallet',
] as const;
export const categorySchema = z
  .object({
    id,
    name,
    kind: z.enum(['expense', 'income']),
    icon: z.enum(icons),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    subcategories: z.array(name).max(30),
  })
  .strict();
export const walletSchema = z
  .object({ id, name, openingBalance: money, color: z.string().regex(/^#[0-9a-f]{6}$/i) })
  .strict();
export const movementSchema = z
  .object({
    id,
    kind: z.enum(['expense', 'income', 'transfer']),
    amount: money.min(1),
    walletId: id,
    toWalletId: id.optional(),
    categoryId: id.optional(),
    subcategory: z.string().max(80).optional(),
    occurredAt: date,
    description: z.string().trim().max(160),
    paymentMethod: z.string().max(60),
    notes: z.string().max(1000),
  })
  .strict();
export const budgetSchema = z
  .object({
    id,
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    categoryId: id.optional(),
    amount: money.min(1),
  })
  .strict();
export const preferencesSchema = z
  .object({
    id: z.literal('preferences'),
    theme: z.enum(['dark', 'light']),
    hidden: z.boolean(),
    lastExportAt: date.optional(),
  })
  .strict();
export const snapshotSchema = z
  .object({
    categories: z.array(categorySchema).min(1).max(500),
    wallets: z.array(walletSchema).min(1).max(100),
    movements: z.array(movementSchema).max(100_000),
    budgets: z.array(budgetSchema).max(5000),
    preferences: preferencesSchema,
  })
  .strict();
export type Category = z.infer<typeof categorySchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Movement = z.infer<typeof movementSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type MovementKind = Movement['kind'];

export function validateSnapshot(input: unknown): Snapshot {
  const s = snapshotSchema.parse(input);
  for (const rows of [s.categories, s.wallets, s.movements, s.budgets]) {
    if (new Set(rows.map((r) => r.id)).size !== rows.length)
      throw new Error('O ficheiro contém identificadores repetidos.');
  }
  for (const kind of ['expense', 'income']) {
    if (!s.categories.some((c) => c.kind === kind))
      throw new Error('É necessária uma categoria de receitas e de despesas.');
  }
  for (const c of s.categories) {
    if (new Set(c.subcategories).size !== c.subcategories.length)
      throw new Error('Subcategorias repetidas.');
  }
  let aggregate = s.wallets.reduce((sum, w) => sum + w.openingBalance, 0);
  for (const m of s.movements) {
    aggregate += m.amount;
    if (!s.wallets.some((w) => w.id === m.walletId)) throw new Error('Carteira inexistente.');
    if (m.kind === 'transfer') {
      if (
        m.categoryId ||
        m.subcategory ||
        !m.toWalletId ||
        m.toWalletId === m.walletId ||
        !s.wallets.some((w) => w.id === m.toWalletId)
      )
        throw new Error('Selecciona duas carteiras diferentes para a transferência.');
    } else {
      const category = s.categories.find((c) => c.id === m.categoryId && c.kind === m.kind);
      if (!category || m.toWalletId) throw new Error('Categoria incompatível com o movimento.');
      if (m.subcategory && !category.subcategories.includes(m.subcategory))
        throw new Error('Subcategoria inexistente.');
    }
  }
  if (!Number.isSafeInteger(aggregate))
    throw new Error('O total excede o limite de precisão monetária.');
  const budgetKeys = new Set<string>();
  for (const b of s.budgets) {
    if (b.categoryId && !s.categories.some((c) => c.id === b.categoryId && c.kind === 'expense'))
      throw new Error('Categoria de orçamento inválida.');
    const key = `${b.month}:${b.categoryId ?? 'all'}`;
    if (budgetKeys.has(key)) throw new Error('Orçamento repetido para o mesmo mês e categoria.');
    budgetKeys.add(key);
  }
  return s;
}
