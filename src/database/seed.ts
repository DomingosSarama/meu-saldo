import type { Category, Snapshot } from '../models/finance';
const expenses: [string, Category['icon'], string, string[]?][] = [
  ['Alimentação', 'utensils', '#f4b860', ['Supermercado', 'Restaurantes', 'Lanches', 'Outros']],
  ['Transporte', 'car', '#7ca6f8', ['Chapa', 'Táxi', 'Combustível', 'Manutenção']],
  ['Habitação', 'home', '#b69af5'],
  ['Água e energia', 'zap', '#edcf68'],
  ['Internet e telefone', 'phone', '#78bce8'],
  ['Educação', 'book', '#8cbb86'],
  ['Saúde', 'heart', '#f08f9d'],
  ['Compras', 'bag', '#dc9de5'],
  ['Lazer', 'coffee', '#eaa576'],
  [
    'Namorada ❤️',
    'heart',
    '#ec83ad',
    ['Presentes', 'Encontros', 'Passeios', 'Surpresas', 'Outros'],
  ],
  ['Família e presentes', 'gift', '#bd9cf7'],
  ['Subscrições', 'repeat', '#91a7e4'],
  ['Taxas e encargos', 'receipt', '#a8b6c4'],
  ['Outros', 'grid', '#91aaa0'],
];
export function initialSnapshot(): Snapshot {
  return {
    categories: [
      ...expenses.map(([name, icon, color, subcategories], i) => ({
        id: `expense-${i}`,
        name,
        kind: 'expense' as const,
        icon,
        color,
        subcategories: subcategories ?? [],
      })),
      ...[
        'Salário',
        'Bolsa de estudo',
        'Negócios',
        'Trabalho freelance',
        'Presentes recebidos',
        'Reembolsos',
        'Outros rendimentos',
      ].map((name, i) => ({
        id: `income-${i}`,
        name,
        kind: 'income' as const,
        icon: 'briefcase' as const,
        color: '#66d6a3',
        subcategories: [],
      })),
    ],
    wallets: ['Dinheiro físico', 'M-Pesa', 'e-Mola', 'Conta bancária'].map((name, i) => ({
      id: `wallet-${i}`,
      name,
      openingBalance: 0,
      color: ['#79d7af', '#e99292', '#f4b860', '#9badea'][i],
    })),
    movements: [],
    budgets: [],
    preferences: { id: 'preferences', theme: 'dark', hidden: false },
  };
}
