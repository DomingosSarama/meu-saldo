import {
  type Budget,
  type Category,
  type Movement,
  type Preferences,
  type Snapshot,
  type Wallet,
  validateSnapshot,
} from '../models/finance';
import { FinanceDB, db } from '../database/db';
import { monthKey } from '../utils/dates';

export function walletBalance(s: Snapshot, id: string): number {
  return (
    (s.wallets.find((w) => w.id === id)?.openingBalance ?? 0) +
    s.movements.reduce(
      (sum, m) =>
        sum +
        (m.walletId === id ? (m.kind === 'income' ? m.amount : -m.amount) : 0) +
        (m.kind === 'transfer' && m.toWalletId === id ? m.amount : 0),
      0,
    )
  );
}
export function totals(movements: Movement[]) {
  return movements.reduce(
    (t, m) => ({
      income: t.income + (m.kind === 'income' ? m.amount : 0),
      expense: t.expense + (m.kind === 'expense' ? m.amount : 0),
    }),
    { income: 0, expense: 0 },
  );
}
export function inMonth(movements: Movement[], month: string) {
  return movements.filter((m) => monthKey(new Date(m.occurredAt)) === month);
}
export function budgetUsage(s: Snapshot, budget: Budget) {
  const used = inMonth(s.movements, budget.month)
    .filter(
      (m) => m.kind === 'expense' && (!budget.categoryId || m.categoryId === budget.categoryId),
    )
    .reduce((n, m) => n + m.amount, 0);
  return { used, remaining: budget.amount - used, percent: (used / budget.amount) * 100 };
}

// Every write validates inside the same read/write transaction as its reads.
// Concurrent tabs therefore cannot leave dangling references or partial transfers.
export class FinanceService {
  constructor(readonly database: FinanceDB = db) {}
  private async write(change: (s: Snapshot) => void) {
    await this.database.transaction('rw', this.database.tables, async () => {
      const s = await this.database.snapshot();
      change(s);
      const validated = validateSnapshot(s);
      await this.replaceTables(validated);
    });
  }
  private async replaceTables(s: Snapshot) {
    for (const table of this.database.tables) await table.clear();
    await this.database.categories.bulkPut(s.categories);
    await this.database.wallets.bulkPut(s.wallets);
    await this.database.movements.bulkPut(s.movements);
    await this.database.budgets.bulkPut(s.budgets);
    await this.database.preferences.put(s.preferences);
  }
  async saveMovement(movement: Movement, newCategory?: Category) {
    await this.write((s) => {
      if (newCategory) s.categories.push(newCategory);
      s.movements = [...s.movements.filter((m) => m.id !== movement.id), movement];
    });
  }
  async deleteMovement(id: string) {
    await this.write((s) => {
      s.movements = s.movements.filter((m) => m.id !== id);
    });
  }
  async saveWallet(wallet: Wallet) {
    await this.write((s) => {
      s.wallets = [...s.wallets.filter((w) => w.id !== wallet.id), wallet];
    });
  }
  async saveCategory(category: Category) {
    await this.write((s) => {
      const old = s.categories.find((c) => c.id === category.id);
      if (old && old.kind !== category.kind && s.movements.some((m) => m.categoryId === old.id))
        throw new Error('Não podes alterar o tipo de uma categoria com movimentos.');
      // Removed subcategories fall back to their parent without deleting history.
      s.movements = s.movements.map((m) =>
        m.categoryId === category.id &&
        m.subcategory &&
        !category.subcategories.includes(m.subcategory)
          ? { ...m, subcategory: undefined }
          : m,
      );
      s.categories = [...s.categories.filter((c) => c.id !== category.id), category];
    });
  }
  async deleteCategory(id: string, replacementId: string) {
    await this.write((s) => {
      const old = s.categories.find((c) => c.id === id);
      const replacement = s.categories.find((c) => c.id === replacementId);
      if (!old || !replacement || id === replacementId || replacement.kind !== old.kind)
        throw new Error('Escolhe outra categoria do mesmo tipo para reclassificar os movimentos.');
      s.movements = s.movements.map((m) =>
        m.categoryId === id ? { ...m, categoryId: replacementId, subcategory: undefined } : m,
      );
      // Existing limits are not silently merged. Resolve the collision explicitly first.
      s.budgets = s.budgets.map((b) =>
        b.categoryId === id ? { ...b, categoryId: replacementId } : b,
      );
      s.categories = s.categories.filter((c) => c.id !== id);
    });
  }
  async saveBudget(budget: Budget) {
    await this.write((s) => {
      s.budgets = [
        ...s.budgets.filter(
          (b) =>
            b.id !== budget.id && !(b.month === budget.month && b.categoryId === budget.categoryId),
        ),
        budget,
      ];
    });
  }
  async deleteBudget(id: string) {
    await this.write((s) => {
      s.budgets = s.budgets.filter((b) => b.id !== id);
    });
  }
  async setPreferences(preferences: Partial<Omit<Preferences, 'id'>>) {
    await this.write((s) => {
      s.preferences = { ...s.preferences, ...preferences };
    });
  }
  async restore(input: unknown) {
    const s = validateSnapshot(input);
    await this.database.transaction('rw', this.database.tables, () => this.replaceTables(s));
  }
}
export const finance = new FinanceService();
