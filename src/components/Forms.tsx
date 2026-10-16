import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Check, Plus, Trash2 } from 'lucide-react';
import {
  icons,
  type Category,
  type Movement,
  type MovementKind,
  type Snapshot,
  type Wallet,
  type Budget,
} from '../models/finance';
import { dateInput, monthKey } from '../utils/dates';
import { moneyInput, parseMoney } from '../utils/money';
import { finance } from '../services/finance';
import { NamedIcon } from './Icon';
import { friendlyError } from '../utils/errors';

type Done = (message: string) => void;
export function AsyncForm({
  children,
  onSubmit,
  label = 'Guardar',
  danger = false,
}: {
  children: ReactNode;
  onSubmit: () => Promise<void>;
  label?: string;
  danger?: boolean;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      {children}
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <button className={danger ? 'button danger' : 'button primary'} disabled={busy} type="submit">
        {busy ? (
          'A guardar…'
        ) : (
          <>
            {danger ? <Trash2 size={18} /> : <Check size={18} />}
            {label}
          </>
        )}
      </button>
    </form>
  );
}
const iconNames = {
  utensils: 'Talheres',
  car: 'Carro',
  home: 'Casa',
  zap: 'Energia',
  phone: 'Telefone',
  book: 'Livro',
  heart: 'Coração',
  bag: 'Compras',
  coffee: 'Café',
  gift: 'Presente',
  repeat: 'Repetição',
  receipt: 'Recibo',
  grid: 'Grelha',
  briefcase: 'Trabalho',
  wallet: 'Carteira',
};
const colors = [
  '#66d6a3',
  '#f4b860',
  '#7ca6f8',
  '#b69af5',
  '#f08f9d',
  '#eaa576',
  '#91aaa0',
  '#dc9de5',
];
export function CategoryFields({
  category,
  onChange,
}: {
  category: Category;
  onChange: (c: Category) => void;
}) {
  const [subs, setSubs] = useState(category.subcategories.join(', '));
  return (
    <>
      <label>
        Nome da categoria
        <input
          required
          maxLength={80}
          value={category.name}
          onChange={(e) => onChange({ ...category, name: e.target.value })}
          placeholder="Ex.: Animais de estimação"
        />
      </label>
      <label>
        Subcategorias <span className="optional">separadas por vírgulas</span>
        <input
          value={subs}
          maxLength={1000}
          onChange={(e) => {
            setSubs(e.target.value);
            onChange({
              ...category,
              subcategories: [
                ...new Set(
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                ),
              ],
            });
          }}
          placeholder="Ex.: Alimentação, Veterinário"
        />
      </label>
      <fieldset>
        <legend>Ícone</legend>
        <div className="icon-choices">
          {icons.map((icon) => (
            <button
              aria-label={iconNames[icon]}
              aria-pressed={category.icon === icon}
              className={category.icon === icon ? 'selected' : ''}
              type="button"
              key={icon}
              onClick={() => onChange({ ...category, icon })}
            >
              <NamedIcon name={icon} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Cor</legend>
        <div className="color-choices">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Cor ${color}`}
              aria-pressed={category.color === color}
              style={{ background: color }}
              className={category.color === color ? 'selected' : ''}
              onClick={() => onChange({ ...category, color })}
            >
              {category.color === color && <Check size={16} />}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}
function blankCategory(kind: 'expense' | 'income'): Category {
  return {
    id: crypto.randomUUID(),
    name: '',
    kind,
    icon: 'grid',
    color: '#66d6a3',
    subcategories: [],
  };
}
export function CategoryForm({ existing, done }: { existing?: Category; done: Done }) {
  const [category, setCategory] = useState(existing ?? blankCategory('expense'));
  return (
    <AsyncForm
      onSubmit={async () => {
        await finance.saveCategory(category);
        done('Categoria guardada.');
      }}
    >
      <label>
        Tipo
        <select
          aria-label="Tipo de categoria"
          value={category.kind}
          disabled={!!existing}
          onChange={(e) =>
            setCategory({ ...category, kind: e.target.value as 'expense' | 'income' })
          }
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </label>
      <CategoryFields category={category} onChange={setCategory} />
    </AsyncForm>
  );
}
export function MovementForm({
  s,
  existing,
  initialKind = 'expense',
  done,
  onDelete,
}: {
  s: Snapshot;
  existing?: Movement;
  initialKind?: MovementKind;
  done: Done;
  onDelete: () => void;
}) {
  const [kind, setKind] = useState(existing?.kind ?? initialKind);
  const [amount, setAmount] = useState(existing ? moneyInput(existing.amount) : '');
  const [walletId, setWalletId] = useState(existing?.walletId ?? s.wallets[0].id);
  const [toWalletId, setToWalletId] = useState(
    existing?.toWalletId ?? s.wallets.find((w) => w.id !== walletId)?.id ?? '',
  );
  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? s.categories.find((c) => c.kind === kind)?.id ?? '',
  );
  const [subcategory, setSubcategory] = useState(existing?.subcategory ?? '');
  const [at, setAt] = useState(dateInput(existing ? new Date(existing.occurredAt) : undefined));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [payment, setPayment] = useState(existing?.paymentMethod ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [custom, setCustom] = useState<Category | undefined>();
  const selected = s.categories.find((c) => c.id === categoryId);
  const changeKind = (next: MovementKind) => {
    setKind(next);
    setCategoryId(s.categories.find((c) => c.kind === next)?.id ?? '');
    setSubcategory('');
    setCustom(undefined);
  };
  return (
    <AsyncForm
      label={existing ? 'Guardar alterações' : 'Adicionar movimento'}
      onSubmit={async () => {
        if (kind !== 'transfer' && categoryId === '__new' && !custom)
          throw new Error('Preenche a nova categoria.');
        await finance.saveMovement(
          {
            id: existing?.id ?? crypto.randomUUID(),
            kind,
            amount: parseMoney(amount),
            walletId,
            toWalletId: kind === 'transfer' ? toWalletId : undefined,
            categoryId: kind === 'transfer' ? undefined : (custom?.id ?? categoryId),
            subcategory: kind === 'transfer' || custom ? undefined : subcategory || undefined,
            occurredAt: new Date(at).toISOString(),
            description,
            paymentMethod: payment,
            notes,
          },
          kind === 'transfer' ? undefined : custom,
        );
        done(existing ? 'Movimento actualizado.' : 'Movimento adicionado.');
      }}
    >
      <div className="segmented" role="group" aria-label="Tipo de movimento">
        {(
          [
            ['expense', 'Despesa', ArrowUpRight],
            ['income', 'Receita', ArrowDownLeft],
            ['transfer', 'Transferir', ArrowRightLeft],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            type="button"
            key={value}
            aria-pressed={kind === value}
            className={kind === value ? 'active' : ''}
            onClick={() => changeKind(value)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <label className="amount-label">
        Valor em meticais
        <div className="amount-input">
          <span>MT</span>
          <input
            autoFocus
            required
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Valor em meticais"
          />
        </div>
      </label>
      <label>
        {kind === 'transfer' ? 'Carteira de origem' : 'Carteira'}
        <select
          aria-label={kind === 'transfer' ? 'Carteira de origem' : 'Carteira'}
          value={walletId}
          onChange={(e) => {
            setWalletId(e.target.value);
            if (e.target.value === toWalletId)
              setToWalletId(s.wallets.find((w) => w.id !== e.target.value)?.id ?? '');
          }}
        >
          {s.wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      {kind === 'transfer' ? (
        <>
          <label>
            Carteira de destino
            <select
              aria-label="Carteira de destino"
              required
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
            >
              <option value="">Seleccionar</option>
              {s.wallets
                .filter((w) => w.id !== walletId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </label>
          <p className="hint">
            O dinheiro muda de carteira. O saldo total, as receitas e as despesas mantêm-se.
          </p>
        </>
      ) : (
        <>
          <label>
            Categoria
            <select
              aria-label="Categoria"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategory('');
                setCustom(e.target.value === '__new' ? blankCategory(kind) : undefined);
              }}
            >
              {s.categories
                .filter((c) => c.kind === kind)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              <option value="__new">＋ Criar categoria personalizada</option>
            </select>
          </label>
          {selected?.name === 'Outros' && !custom && (
            <div className="other-category">
              <p>
                Uma despesa ocasional? Guarda em Outros. Para despesas frequentes, cria uma
                categoria.
              </p>
              <button
                className="text-button"
                type="button"
                onClick={() => setCustom(blankCategory(kind))}
              >
                <Plus size={16} />
                Criar nova categoria
              </button>
            </div>
          )}
          {custom ? (
            <div className="inline-form">
              <h3>Nova categoria</h3>
              <CategoryFields category={custom} onChange={setCustom} />
              {categoryId !== '__new' && (
                <button className="text-button" type="button" onClick={() => setCustom(undefined)}>
                  Usar a categoria Outros
                </button>
              )}
            </div>
          ) : (
            !!selected?.subcategories.length && (
              <label>
                Subcategoria <span className="optional">opcional</span>
                <select
                  aria-label="Subcategoria"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  <option value="">Sem subcategoria</option>
                  {selected.subcategories.map((sub) => (
                    <option key={sub}>{sub}</option>
                  ))}
                </select>
              </label>
            )
          )}
        </>
      )}
      <label>
        Data e hora
        <input required type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      </label>
      <label>
        Descrição <span className="optional">opcional</span>
        <input
          maxLength={160}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            kind === 'income' ? 'De onde veio este dinheiro?' : 'Em que utilizaste o dinheiro?'
          }
        />
      </label>
      <details>
        <summary>Mais detalhes</summary>
        <div className="form-stack">
          <label>
            Método de pagamento
            <input
              maxLength={60}
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="Ex.: Cartão, dinheiro, pagamento móvel"
            />
          </label>
          <label>
            Observações
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      </details>
      {existing && (
        <button className="text-button red" type="button" onClick={onDelete}>
          <Trash2 size={16} />
          Eliminar movimento
        </button>
      )}
    </AsyncForm>
  );
}
export function WalletForm({ existing, done }: { existing?: Wallet; done: Done }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [opening, setOpening] = useState(moneyInput(existing?.openingBalance ?? 0));
  return (
    <AsyncForm
      onSubmit={async () => {
        await finance.saveWallet({
          id: existing?.id ?? crypto.randomUUID(),
          name,
          openingBalance: parseMoney(opening),
          color: existing?.color ?? '#66d6a3',
        });
        done('Carteira guardada.');
      }}
    >
      <label>
        Nome da carteira
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Poupanças"
        />
      </label>
      <label>
        Saldo inicial em MT
        <input
          required
          inputMode="decimal"
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
        />
      </label>
      <p className="hint">
        O saldo inicial representa o dinheiro que já tinhas antes de começar o histórico. Não conta
        como receita. Alterá-lo ajusta o saldo actual.
      </p>
    </AsyncForm>
  );
}
export function BudgetForm({
  s,
  existing,
  month,
  done,
  onDelete,
}: {
  s: Snapshot;
  existing?: Budget;
  month?: string;
  done: Done;
  onDelete: () => void;
}) {
  const [at, setAt] = useState(existing?.month ?? month ?? monthKey());
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [amount, setAmount] = useState(existing ? moneyInput(existing.amount) : '');
  return (
    <AsyncForm
      onSubmit={async () => {
        await finance.saveBudget({
          id: existing?.id ?? crypto.randomUUID(),
          month: at,
          categoryId: categoryId || undefined,
          amount: parseMoney(amount),
        });
        done('Orçamento guardado.');
      }}
    >
      <label>
        Mês
        <input required type="month" value={at} onChange={(e) => setAt(e.target.value)} />
      </label>
      <label>
        Âmbito
        <select
          aria-label="Âmbito"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Orçamento geral</option>
          {s.categories
            .filter((c) => c.kind === 'expense')
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Limite em MT
        <input
          autoFocus
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex.: 15000"
        />
      </label>
      <p className="hint">
        Um limite já definido para este mês e categoria será actualizado. Os alertas não impedem o
        registo de despesas.
      </p>
      {existing && (
        <button className="text-button red" type="button" onClick={onDelete}>
          <Trash2 size={16} />
          Eliminar orçamento
        </button>
      )}
    </AsyncForm>
  );
}
export function RemoveCategoryForm({
  category,
  s,
  done,
}: {
  category: Category;
  s: Snapshot;
  done: Done;
}) {
  const [replacement, setReplacement] = useState('');
  return (
    <AsyncForm
      danger
      label="Reclassificar e eliminar"
      onSubmit={async () => {
        await finance.deleteCategory(category.id, replacement);
        done('Categoria eliminada. Movimentos reclassificados.');
      }}
    >
      <p>
        Os movimentos de <strong>{category.name}</strong> serão preservados e atribuídos à categoria
        escolhida. Os limites por categoria também serão transferidos; se houver um limite em
        conflito, resolve-o primeiro em Orçamentos.
      </p>
      <label>
        Reclassificar para
        <select
          aria-label="Reclassificar para"
          required
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
        >
          <option value="">Selecciona outra categoria</option>
          {s.categories
            .filter((c) => c.kind === category.kind && c.id !== category.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
    </AsyncForm>
  );
}
