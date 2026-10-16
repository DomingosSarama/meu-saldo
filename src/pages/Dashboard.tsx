import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Eye,
  EyeOff,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type { Movement, MovementKind, Snapshot } from '../models/finance';
import { budgetUsage, inMonth, totals, walletBalance } from '../services/finance';
import { monthLabel } from '../utils/dates';
import { Value, Empty, MovementList, SectionTitle } from '../components/Shared';
import { CategoryChart, DailyChart } from '../components/Charts';

type Props = {
  s: Snapshot;
  month: string;
  add: (kind?: MovementKind) => void;
  edit: (m: Movement) => void;
  navigate: (page: 'movements' | 'wallets' | 'budgets' | 'settings') => void;
  toggleHidden: () => void;
  setBudget: () => void;
};
export function Dashboard({ s, month, add, edit, navigate, toggleHidden, setBudget }: Props) {
  const hidden = s.preferences.hidden;
  const movements = inMonth(s.movements, month);
  const current = totals(movements);
  const total = s.wallets.reduce((sum, w) => sum + walletBalance(s, w.id), 0);
  const budget = s.budgets.find((b) => b.month === month && !b.categoryId);
  const usage = budget ? budgetUsage(s, budget) : undefined;
  const previousMonth = new Date(`${month}-01T12:00`);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previous = totals(
    inMonth(
      s.movements,
      `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`,
    ),
  );
  const difference =
    previous.expense > 0
      ? ((current.expense - previous.expense) / previous.expense) * 100
      : undefined;
  return (
    <>
      <section className="overview-grid" aria-label="Resumo financeiro">
        <div className="balance-card">
          <div className="balance-top">
            <span className="card-caption">
              <span className="status-dot" />
              SALDO TOTAL DISPONÍVEL
            </span>
            <button
              className="icon-button"
              aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
              onClick={toggleHidden}
            >
              {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <div className="balance-value">
            <Value amount={total} hidden={hidden} />
          </div>
          <p>O teu dinheiro, em {s.wallets.length} carteiras.</p>
          <div className="balance-bottom">
            <span>
              <ShieldCheck size={15} />
              Só neste dispositivo
            </span>
            <span className="balance-decoration" aria-hidden="true">
              m.
            </span>
          </div>
        </div>
        <div className="summary-card">
          <span className="stat-icon income">
            <ArrowDownLeft size={21} />
          </span>
          <p>Receitas do mês</p>
          <strong>
            <Value amount={current.income} hidden={hidden} />
          </strong>
          <span className="stat-foot">
            Dinheiro que entrou <ArrowDownLeft size={13} />
          </span>
        </div>
        <div className="summary-card">
          <span className="stat-icon expense">
            <ArrowUpRight size={21} />
          </span>
          <p>Despesas do mês</p>
          <strong>
            <Value amount={current.expense} hidden={hidden} />
          </strong>
          <span className="stat-foot">
            {hidden
              ? 'Valores ocultos'
              : difference === undefined
                ? 'Sem comparação anterior'
                : `${Math.abs(difference).toFixed(0)}% ${difference > 0 ? 'mais' : 'menos'} que o mês anterior`}
            <ArrowUpRight size={13} />
          </span>
        </div>
      </section>
      <div className="quick-actions">
        <button onClick={() => add('expense')}>
          <span>
            <Plus size={18} />
          </span>
          Nova despesa
        </button>
        <button onClick={() => add('income')}>
          <span>
            <ArrowDownLeft size={18} />
          </span>
          Nova receita
        </button>
        <button onClick={() => add('transfer')}>
          <span>
            <ArrowRightLeft size={17} />
          </span>
          Transferir
        </button>
        <button onClick={() => navigate('wallets')}>
          <span>
            <Wallet size={17} />
          </span>
          As minhas carteiras
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="panel">
            <SectionTitle
              title="Últimos movimentos"
              eyebrow="O TEU DIA A DIA"
              action={
                <button className="text-button" onClick={() => navigate('movements')}>
                  Ver todos <ArrowRight size={15} />
                </button>
              }
            />
            {s.movements.length ? (
              <MovementList
                s={s}
                movements={s.movements
                  .slice()
                  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
                  .slice(0, 5)}
                onEdit={edit}
              />
            ) : (
              <Empty
                title="Um novo começo para as tuas finanças"
                description="Adiciona a tua primeira receita ou despesa. Cada pequeno registo faz a diferença."
                action={
                  <button className="button secondary" onClick={() => add()}>
                    <Plus size={17} />
                    Adicionar primeiro movimento
                  </button>
                }
              />
            )}
          </section>
          <section className="panel">
            <SectionTitle
              title="O ritmo do teu mês"
              eyebrow="EVOLUÇÃO DAS DESPESAS"
              action={<span className="subtle-tag">{monthLabel(month)}</span>}
            />
            <DailyChart movements={movements} month={month} hidden={hidden} />
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="panel budget-panel">
            <SectionTitle
              title="Orçamento mensal"
              action={
                <button
                  className="icon-button"
                  aria-label="Definir orçamento mensal"
                  onClick={setBudget}
                >
                  <ArrowUpRight size={21} />
                </button>
              }
            />
            {budget && usage ? (
              <>
                <div className="budget-values">
                  <strong>
                    <Value amount={usage.used} hidden={hidden} />
                  </strong>
                  <span>
                    de <Value amount={budget.amount} hidden={hidden} />
                  </span>
                </div>
                <div
                  className={`progress ${usage.percent >= 90 ? 'warning' : ''}`}
                  role="progressbar"
                  aria-label="Orçamento utilizado"
                  aria-valuenow={hidden ? undefined : Math.min(100, Math.round(usage.percent))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${Math.min(100, usage.percent)}%` }} />
                </div>
                <div className="budget-caption">
                  <span>{hidden ? '••••' : `${usage.percent.toFixed(0)}% utilizado`}</span>
                  <button className="text-button" onClick={() => navigate('budgets')}>
                    Detalhes <ArrowRight size={13} />
                  </button>
                </div>
                {usage.percent >= 90 && (
                  <p className="alert warning">
                    {usage.percent >= 100
                      ? 'Atingiste o limite deste mês.'
                      : 'Estás próximo do limite deste mês.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="muted">Dá um destino ao teu dinheiro antes de o gastar.</p>
                <div className="progress">
                  <span />
                </div>
                <button className="text-button" onClick={setBudget}>
                  Definir o meu orçamento <ArrowRight size={15} />
                </button>
              </>
            )}
          </section>
          <section className="panel">
            <SectionTitle title="Para onde vai o dinheiro" eyebrow="DESPESAS POR CATEGORIA" />
            <CategoryChart s={s} movements={movements} />
          </section>
          <button className="backup-callout" onClick={() => navigate('settings')}>
            <ShieldCheck size={24} />
            <span>
              <strong>O teu dinheiro é pessoal.</strong>
              <span>Os teus dados também. Faz um backup.</span>
            </span>
            <ArrowUpRight size={18} />
          </button>
        </aside>
      </div>
    </>
  );
}
