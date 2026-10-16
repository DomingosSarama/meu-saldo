import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FinanceDB } from '../database/db';
import { FinanceService, walletBalance, totals, budgetUsage } from '../services/finance';
import { initialSnapshot } from '../database/seed';
import { parseMoney } from '../utils/money';
import { createBackup, parseBackup, exportCSV } from '../services/backup';
import type { Movement } from '../models/finance';

let database: FinanceDB;
let service: FinanceService;
const movement = (overrides: Partial<Movement> = {}): Movement => ({
  id: crypto.randomUUID(),
  kind: 'income',
  amount: 100_000,
  walletId: 'wallet-0',
  categoryId: 'income-0',
  occurredAt: '2026-10-16T12:00:00.000Z',
  description: '',
  paymentMethod: '',
  notes: '',
  ...overrides,
});
beforeEach(async () => {
  database = new FinanceDB(`test-${crypto.randomUUID()}`);
  service = new FinanceService(database);
  await database.open();
});
afterEach(async () => {
  await database.delete();
});

describe('precisão monetária', () => {
  it('converte decimais sem arredondamento binário', () => {
    expect(parseMoney('0,10') + parseMoney('0.20')).toBe(30);
    expect(parseMoney('100,01')).toBe(10001);
  });
  it.each(['-1', '1.001', 'NaN', '1e3', '1,000.00', '', '90000000001'])('rejeita %s', (value) => {
    expect(() => parseMoney(value)).toThrow();
  });
});
describe('operações persistentes', () => {
  it('inicia com categorias e carteiras sem dados fictícios', async () => {
    const s = await database.snapshot();
    expect(s.movements).toHaveLength(0);
    expect(s.categories).toHaveLength(21);
    expect(s.wallets).toHaveLength(4);
    expect(s.wallets.map((w) => walletBalance(s, w.id))).toEqual([0, 0, 0, 0]);
  });
  it('cria receita, despesa e actualiza saldos ao editar e eliminar', async () => {
    const income = movement();
    const expense = movement({ kind: 'expense', categoryId: 'expense-0', amount: 12345 });
    await service.saveMovement(income);
    await service.saveMovement(expense);
    expect(walletBalance(await database.snapshot(), 'wallet-0')).toBe(87655);
    await service.saveMovement({ ...expense, amount: 10000 });
    expect(walletBalance(await database.snapshot(), 'wallet-0')).toBe(90000);
    await service.deleteMovement(expense.id);
    expect(walletBalance(await database.snapshot(), 'wallet-0')).toBe(100000);
  });
  it('guarda uma transferência única sem alterar receitas/despesas globais', async () => {
    await service.saveMovement(movement());
    const transfer = movement({
      kind: 'transfer',
      categoryId: undefined,
      toWalletId: 'wallet-1',
      amount: 30000,
    });
    await service.saveMovement(transfer);
    const s = await database.snapshot();
    expect(walletBalance(s, 'wallet-0')).toBe(70000);
    expect(walletBalance(s, 'wallet-1')).toBe(30000);
    expect(totals(s.movements)).toEqual({ income: 100000, expense: 0 });
    await service.deleteMovement(transfer.id);
    expect(walletBalance(await database.snapshot(), 'wallet-1')).toBe(0);
  });
  it('rejeita referências inválidas e transferências para a mesma carteira sem alterar dados', async () => {
    const before = await database.snapshot();
    await expect(service.saveMovement(movement({ walletId: 'missing' }))).rejects.toThrow();
    await expect(
      service.saveMovement(
        movement({ kind: 'transfer', categoryId: undefined, toWalletId: 'wallet-0' }),
      ),
    ).rejects.toThrow();
    await expect(service.saveMovement(movement({ amount: 0.1 }))).rejects.toThrow();
    expect(await database.snapshot()).toEqual(before);
  });
  it('cria categoria com movimento de forma atómica e reclassifica ao remover', async () => {
    const category = {
      ...initialSnapshot().categories[0],
      id: 'custom',
      name: 'Animais',
      subcategories: ['Comida'],
    };
    await service.saveMovement(
      movement({ kind: 'expense', categoryId: 'custom', subcategory: 'Comida' }),
      category,
    );
    await service.deleteCategory('custom', 'expense-0');
    const s = await database.snapshot();
    expect(s.movements[0].categoryId).toBe('expense-0');
    expect(s.movements[0].subcategory).toBeUndefined();
    expect(s.categories.some((c) => c.id === 'custom')).toBe(false);
  });
  it('impede remover categoria sem reclassificação válida', async () => {
    await expect(service.deleteCategory('expense-0', 'income-0')).rejects.toThrow();
    expect(await database.categories.get('expense-0')).toBeDefined();
  });
  it('reabre a base de dados e preserva o histórico', async () => {
    await service.saveMovement(movement());
    const name = database.name;
    database.close();
    database = new FinanceDB(name);
    await database.open();
    expect((await database.snapshot()).movements).toHaveLength(1);
  });
  it('calcula orçamento por mês e categoria e permite ultrapassar o limite', async () => {
    const budget = { id: 'budget', month: '2026-10', categoryId: 'expense-0', amount: 1000 };
    await service.saveBudget(budget);
    await service.saveMovement(
      movement({ kind: 'expense', categoryId: 'expense-0', amount: 1200 }),
    );
    await service.saveMovement(movement({ kind: 'expense', categoryId: 'expense-1', amount: 200 }));
    await service.saveMovement(
      movement({
        kind: 'expense',
        categoryId: 'expense-0',
        amount: 200,
        occurredAt: '2026-09-20T12:00:00.000Z',
      }),
    );
    expect(budgetUsage(await database.snapshot(), budget)).toEqual({
      used: 1200,
      remaining: -200,
      percent: 120,
    });
  });
});
describe('backup e recuperação', () => {
  it('exporta, valida e restaura dados completos', async () => {
    await service.saveMovement(movement());
    const original = await database.snapshot();
    const backup = parseBackup(createBackup(original));
    await service.restore(initialSnapshot());
    expect(await database.movements.count()).toBe(0);
    await service.restore(backup.data);
    expect(await database.snapshot()).toEqual(original);
  });
  it('rejeita versões, duplicados e referências inválidas preservando dados', async () => {
    const before = await database.snapshot();
    const backup = JSON.parse(createBackup(before));
    backup.version = 2;
    expect(() => parseBackup(JSON.stringify(backup))).toThrow();
    expect(() => parseBackup('<script>alert(1)</script>')).toThrow();
    const bad = structuredClone(before);
    bad.wallets.push(bad.wallets[0]);
    await expect(service.restore(bad)).rejects.toThrow();
    const badRef = structuredClone(before);
    badRef.movements.push(movement({ walletId: 'missing' }));
    await expect(service.restore(badRef)).rejects.toThrow();
    expect(await database.snapshot()).toEqual(before);
  });
  it('faz rollback completo se a gravação falhar durante a restauração', async () => {
    await service.saveMovement(movement());
    const before = await database.snapshot();
    const hook = () => {
      throw new Error('Quota simulada');
    };
    database.wallets.hook('creating', hook);
    await expect(service.restore(initialSnapshot())).rejects.toThrow('Quota simulada');
    database.wallets.hook('creating').unsubscribe(hook);
    expect(await database.snapshot()).toEqual(before);
  });
  it('escapa texto e fórmulas no CSV', () => {
    const s = initialSnapshot();
    s.movements.push(movement({ description: ' =HYPERLINK("url")' }));
    const csv = exportCSV(s);
    expect(csv).toContain('"\' =HYPERLINK(""url"")"');
    expect(csv).toContain('1000.00');
  });
});
