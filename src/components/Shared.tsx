import type { ReactNode } from 'react';
import { ArrowRight, ArrowRightLeft, ChevronRight, ReceiptText } from 'lucide-react';
import type { Movement, Snapshot } from '../models/finance';
import { money } from '../utils/money';
import { shortDate } from '../utils/dates';
import { CategoryIcon } from './Icon';
export function Value({ amount, hidden = false }: { amount: number; hidden?: boolean }) {
  return <>{hidden ? '••••••' : money(amount)}</>;
}
export function Empty({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty ${compact ? 'compact' : ''}`}>
      <span className="empty-icon">
        <ReceiptText size={26} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function MovementList({
  s,
  movements,
  onEdit,
}: {
  s: Snapshot;
  movements: Movement[];
  onEdit: (m: Movement) => void;
}) {
  return (
    <div className="movement-list">
      {movements.map((m) => {
        const category = s.categories.find((c) => c.id === m.categoryId);
        const wallet = s.wallets.find((w) => w.id === m.walletId);
        const to = s.wallets.find((w) => w.id === m.toWalletId);
        return (
          <button className="movement-row" key={m.id} onClick={() => onEdit(m)}>
            <CategoryIcon category={category} />
            <span className="movement-info">
              <strong>{m.description || category?.name || 'Transferência'}</strong>
              <span>
                {wallet?.name}
                {to && (
                  <>
                    <ArrowRight size={10} />
                    {to.name}
                  </>
                )}
                <span className="dot">·</span>
                {shortDate(m.occurredAt)}
              </span>
            </span>
            <span className={`movement-amount ${m.kind === 'income' ? 'green' : ''}`}>
              {s.preferences.hidden ? (
                '••••'
              ) : (
                <>
                  {m.kind === 'expense' ? '−' : m.kind === 'income' ? '+' : ''}
                  <Value amount={m.amount} />
                </>
              )}
              <small>{m.kind === 'transfer' ? <ArrowRightLeft size={13} /> : category?.name}</small>
            </span>
            <ChevronRight size={15} className="muted" />
          </button>
        );
      })}
    </div>
  );
}
