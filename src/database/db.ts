import Dexie, { type EntityTable } from 'dexie';
import type { Budget, Category, Movement, Preferences, Snapshot, Wallet } from '../models/finance';
import { initialSnapshot } from './seed';
export class FinanceDB extends Dexie {
  categories!: EntityTable<Category, 'id'>;
  wallets!: EntityTable<Wallet, 'id'>;
  movements!: EntityTable<Movement, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  preferences!: EntityTable<Preferences, 'id'>;
  constructor(name = 'meusaldo') {
    super(name);
    this.version(1).stores({
      categories: 'id, kind',
      wallets: 'id',
      movements: 'id, occurredAt, walletId, categoryId, kind',
      budgets: 'id, month',
      preferences: 'id',
    });
    this.on('populate', async () => {
      const s = initialSnapshot();
      await this.categories.bulkAdd(s.categories);
      await this.wallets.bulkAdd(s.wallets);
      await this.preferences.add(s.preferences);
    });
  }
  async snapshot(): Promise<Snapshot> {
    return this.transaction('r', this.tables, async () => {
      const [categories, wallets, movements, budgets, preferences] = await Promise.all([
        this.categories.toArray(),
        this.wallets.toArray(),
        this.movements.toArray(),
        this.budgets.toArray(),
        this.preferences.get('preferences'),
      ]);
      if (!preferences) throw new Error('Configuração local em falta. Restaura um backup válido.');
      return { categories, wallets, movements, budgets, preferences };
    });
  }
}
export const db = new FinanceDB();
