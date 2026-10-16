import { Plus, Pencil, AlertCircle } from 'lucide-react';
import type { Budget, Snapshot } from '../models/finance';
import { budgetUsage } from '../services/finance';
import { Value, Empty } from '../components/Shared';
export function Budgets({
  s,
  month,
  edit,
  add,
}: {
  s: Snapshot;
  month: string;
  edit: (b: Budget) => void;
  add: () => void;
}) {
  const budgets = s.budgets.filter((b) => b.month === month);
  return (
    <>
      <div className="page-intro">
        <p>
          Um plano para o teu mês. Define um limite geral e limites para as categorias que queres
          acompanhar.
        </p>
      </div>
      {!budgets.length ? (
        <section className="panel">
          <Empty
            title="Gasta com mais intenção"
            description="Define o teu primeiro orçamento. Recebe um aviso ao atingir 90% do limite, sem bloquear despesas."
            action={
              <button className="button secondary" onClick={add}>
                <Plus size={17} />
                Definir orçamento
              </button>
            }
          />
        </section>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => {
            const usage = budgetUsage(s, b);
            return (
              <section className="panel" key={b.id}>
                <div className="section-title">
                  <h2>
                    {s.categories.find((c) => c.id === b.categoryId)?.name ?? 'Orçamento geral'}
                  </h2>
                  <button
                    className="icon-button"
                    aria-label="Editar orçamento"
                    onClick={() => edit(b)}
                  >
                    <Pencil size={18} />
                  </button>
                </div>
                <div className="budget-values">
                  <strong>
                    <Value amount={usage.used} hidden={s.preferences.hidden} />
                  </strong>
                  <span>
                    de <Value amount={b.amount} hidden={s.preferences.hidden} />
                  </span>
                </div>
                <div
                  className={`progress ${usage.percent >= 90 ? 'warning' : ''}`}
                  role="progressbar"
                  aria-label="Orçamento utilizado"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    s.preferences.hidden ? undefined : Math.min(100, Math.round(usage.percent))
                  }
                >
                  <span style={{ width: `${Math.min(100, usage.percent)}%` }} />
                </div>
                <div className="budget-caption">
                  <span>
                    {s.preferences.hidden ? '••••' : `${usage.percent.toFixed(0)}% utilizado`}
                  </span>
                  <span>
                    Restante: <Value amount={usage.remaining} hidden={s.preferences.hidden} />
                  </span>
                </div>
                {usage.percent >= 90 && (
                  <p className="alert warning">
                    <AlertCircle size={16} />
                    {usage.percent >= 100 ? 'O limite foi atingido.' : 'Estás próximo do limite.'}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
