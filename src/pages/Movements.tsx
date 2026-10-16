import { useState } from 'react';
import { Search, SlidersHorizontal, X, Plus } from 'lucide-react';
import type { Movement, Snapshot } from '../models/finance';
import { Empty, MovementList, Value } from '../components/Shared';
import { totals } from '../services/finance';
import { dateInput } from '../utils/dates';
export function Movements({
  s,
  edit,
  add,
  initialWallet = '',
}: {
  s: Snapshot;
  edit: (m: Movement) => void;
  add: () => void;
  initialWallet?: string;
}) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [wallet, setWallet] = useState(initialWallet);
  const [category, setCategory] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sort, setSort] = useState('recent');
  const [period, setPeriod] = useState('all');
  function changePeriod(value: string) {
    setPeriod(value);
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);
    if (value === 'all' || value === 'custom') {
      setStart('');
      setEnd('');
      return;
    }
    if (value === 'week') from.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    if (value === 'month') from.setDate(1);
    if (value === 'previous') {
      from.setMonth(now.getMonth() - 1, 1);
      to.setDate(0);
    }
    if (value === 'year') from.setMonth(0, 1);
    setStart(dateInput(from).slice(0, 10));
    setEnd(dateInput(to).slice(0, 10));
  }
  const movements = s.movements
    .filter((m) => {
      const day = dateInput(new Date(m.occurredAt)).slice(0, 10);
      const c = s.categories.find((c) => c.id === m.categoryId);
      const text =
        `${m.description} ${m.notes} ${c?.name ?? ''} ${m.subcategory ?? ''}`.toLocaleLowerCase(
          'pt',
        );
      return (
        (!kind || m.kind === kind) &&
        (!wallet || m.walletId === wallet || m.toWalletId === wallet) &&
        (!category || m.categoryId === category) &&
        (!start || day >= start) &&
        (!end || day <= end) &&
        text.includes(search.toLocaleLowerCase('pt'))
      );
    })
    .sort((a, b) =>
      sort === 'highest'
        ? b.amount - a.amount
        : sort === 'lowest'
          ? a.amount - b.amount
          : sort === 'oldest'
            ? a.occurredAt.localeCompare(b.occurredAt)
            : b.occurredAt.localeCompare(a.occurredAt),
    );
  const summary = totals(movements);
  const hasFilters = search || kind || wallet || category || start || end;
  return (
    <>
      <section className="panel filters">
        <div className="search-box">
          <Search size={19} />
          <input
            aria-label="Pesquisar movimentos"
            placeholder="Pesquisar uma descrição, categoria…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-grid">
          <label>
            Período
            <select value={period} onChange={(e) => changePeriod(e.target.value)}>
              <option value="all">Todo o histórico</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="previous">Mês anterior</option>
              <option value="year">Este ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          <label>
            Tipo
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
              <option value="transfer">Transferências</option>
            </select>
          </label>
          <label>
            Carteira
            <select value={wallet} onChange={(e) => setWallet(e.target.value)}>
              <option value="">Todas as carteiras</option>
              {s.wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Todas as categorias</option>
              {s.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <details open={period === 'custom' ? true : undefined}>
          <summary>
            <SlidersHorizontal size={14} />
            Datas e ordenação
          </summary>
          <div className="filter-grid">
            <label>
              Desde
              <input
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPeriod('custom');
                }}
              />
            </label>
            <label>
              Até
              <input
                type="date"
                min={start}
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPeriod('custom');
                }}
              />
            </label>
            <label>
              Ordenar
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="highest">Maior valor</option>
                <option value="lowest">Menor valor</option>
              </select>
            </label>
          </div>
        </details>
        {hasFilters && (
          <button
            className="text-button"
            onClick={() => {
              setSearch('');
              setKind('');
              setWallet('');
              setCategory('');
              setStart('');
              setEnd('');
              setPeriod('all');
            }}
          >
            <X size={14} />
            Limpar filtros
          </button>
        )}
      </section>
      <div className="history-summary">
        <span>{movements.length} movimentos</span>
        <span>
          Receitas{' '}
          <strong className="green">
            <Value amount={summary.income} hidden={s.preferences.hidden} />
          </strong>
        </span>
        <span>
          Despesas{' '}
          <strong>
            <Value amount={summary.expense} hidden={s.preferences.hidden} />
          </strong>
        </span>
      </div>
      <section className="panel">
        {movements.length ? (
          <MovementList s={s} movements={movements} onEdit={edit} />
        ) : (
          <Empty
            title={hasFilters ? 'Nenhum movimento encontrado' : 'O teu histórico começa aqui'}
            description={
              hasFilters
                ? 'Experimenta alterar ou limpar os filtros.'
                : 'Regista receitas, despesas e transferências para veres tudo num só lugar.'
            }
            action={
              !hasFilters && (
                <button className="button secondary" onClick={add}>
                  <Plus size={17} />
                  Adicionar movimento
                </button>
              )
            }
          />
        )}
      </section>
    </>
  );
}
