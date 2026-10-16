import type { Movement, Snapshot } from '../models/finance';
import { money } from '../utils/money';
import { Empty, Value } from './Shared';
export function CategoryChart({ s, movements }: { s: Snapshot; movements: Movement[] }) {
  const data = s.categories
    .map((c) => ({
      ...c,
      amount: movements
        .filter((m) => m.kind === 'expense' && m.categoryId === c.id)
        .reduce((sum, m) => sum + m.amount, 0),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = data.reduce((sum, c) => sum + c.amount, 0);
  if (s.preferences.hidden)
    return (
      <Empty
        compact
        title="Valores ocultos"
        description="Mostra os valores para consultar o gráfico."
      />
    );
  if (!total)
    return (
      <Empty
        compact
        title="Cada metical tem uma história"
        description="As tuas despesas por categoria aparecerão aqui."
      />
    );
  return (
    <div className="category-chart">
      <div className="donut">
        <svg viewBox="0 0 120 120" role="img" aria-label="Distribuição de despesas por categoria">
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--line)" strokeWidth="10" />
          {data.map((c, index) => {
            const length = (c.amount / total) * 301.593;
            const start = data
              .slice(0, index)
              .reduce((sum, item) => sum + (item.amount / total) * 301.593, 0);
            return (
              <circle
                key={c.id}
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={c.color}
                strokeWidth="10"
                strokeDasharray={`${length} ${301.593 - length}`}
                strokeDashoffset={-start}
                transform="rotate(-90 60 60)"
              >
                <title>
                  {c.name}: {money(c.amount)}
                </title>
              </circle>
            );
          })}
        </svg>
        <div>
          <span>TOTAL</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <ul className="chart-legend">
        {data.map((c) => (
          <li key={c.id}>
            <span className="legend-dot" style={{ background: c.color }} />
            <span>{c.name}</span>
            <strong>
              <Value amount={c.amount} />
            </strong>
            <small>{Math.round((c.amount / total) * 100)}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
export function DailyChart({
  movements,
  month,
  hidden,
}: {
  movements: Movement[];
  month: string;
  hidden: boolean;
}) {
  if (hidden)
    return (
      <Empty
        compact
        title="Valores ocultos"
        description="Mostra os valores para consultar a evolução."
      />
    );
  const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const daily = Array.from({ length: days }, (_, i) =>
    movements
      .filter((m) => m.kind === 'expense' && new Date(m.occurredAt).getDate() === i + 1)
      .reduce((sum, m) => sum + m.amount, 0),
  );
  const max = Math.max(...daily);
  if (!max)
    return (
      <Empty
        compact
        title="O teu mês começa aqui"
        description="Regista uma despesa para acompanhar a evolução diária."
      />
    );
  const points = daily
    .map((amount, i) => `${12 + (i / (days - 1)) * 476},${130 - (amount / max) * 108}`)
    .join(' ');
  return (
    <div className="daily-chart">
      <div className="chart-scale">
        <span>{money(max)}</span>
        <span>Despesas diárias</span>
      </div>
      <svg viewBox="0 0 500 150" role="img" aria-label="Evolução diária de despesas">
        <defs>
          <linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#66d6a3" stopOpacity=".23" />
            <stop offset="100%" stopColor="#66d6a3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M12 22 H488 M12 76 H488 M12 130 H488"
          stroke="var(--line)"
          strokeDasharray="3 5"
          fill="none"
        />
        <polygon points={`12,140 ${points} 488,140`} fill="url(#chart-gradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="#66d6a3"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {daily.map(
          (amount, i) =>
            amount > 0 && (
              <circle
                key={i}
                cx={12 + (i / (days - 1)) * 476}
                cy={130 - (amount / max) * 108}
                r="3"
                fill="#66d6a3"
              >
                <title>
                  Dia {i + 1}: {money(amount)}
                </title>
              </circle>
            ),
        )}
      </svg>
      <div className="chart-scale">
        <span>01</span>
        <span>{Math.ceil(days / 2)}</span>
        <span>{days}</span>
      </div>
      <details className="chart-table">
        <summary>Consultar valores diários</summary>
        <ul>
          {daily.map((amount, i) => (
            <li key={i}>
              Dia {i + 1}
              <span>{money(amount)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
