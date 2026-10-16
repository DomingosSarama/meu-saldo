import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpRight as EditIcon,
  Wallet as WalletIcon,
  ArrowRight,
  ArrowRightLeft,
  Plus,
} from 'lucide-react';
import type { Snapshot, Wallet } from '../models/finance';
import { walletBalance, totals } from '../services/finance';
import { Value } from '../components/Shared';
export function Wallets({
  s,
  edit,
  history,
  transfer,
  add,
}: {
  s: Snapshot;
  edit: (w: Wallet) => void;
  history: (id: string) => void;
  transfer: () => void;
  add: () => void;
}) {
  return (
    <>
      <div className="page-intro">
        <p>
          Cada carteira, um lugar para o teu dinheiro. Os saldos incluem o valor inicial e todos os
          movimentos.
        </p>
        <button className="button secondary" onClick={transfer}>
          <ArrowRightLeft size={17} />
          Transferir dinheiro
        </button>
      </div>
      <div className="wallet-grid">
        {s.wallets.map((w) => {
          const t = totals(s.movements.filter((m) => m.walletId === w.id));
          return (
            <section
              className="panel wallet-card"
              key={w.id}
              style={{ '--wallet-color': w.color } as React.CSSProperties}
            >
              <div className="section-title">
                <span className="wallet-symbol">
                  <WalletIcon size={23} />
                </span>
                <button
                  className="icon-button"
                  aria-label={`Editar ${w.name}`}
                  onClick={() => edit(w)}
                >
                  <EditIcon size={19} />
                </button>
              </div>
              <h2>{w.name}</h2>
              <p className="wallet-balance">
                <Value amount={walletBalance(s, w.id)} hidden={s.preferences.hidden} />
              </p>
              <div className="wallet-stats">
                <span>
                  <ArrowDownLeft size={15} />
                  Receitas
                  <strong>
                    <Value amount={t.income} hidden={s.preferences.hidden} />
                  </strong>
                </span>
                <span>
                  <ArrowUpRight size={15} />
                  Despesas
                  <strong>
                    <Value amount={t.expense} hidden={s.preferences.hidden} />
                  </strong>
                </span>
              </div>
              <button className="text-button" onClick={() => history(w.id)}>
                Histórico e transferências <ArrowRight size={15} />
              </button>
            </section>
          );
        })}
        <button className="new-wallet" onClick={add}>
          <span>
            <Plus size={25} />
          </span>
          <strong>Uma nova carteira</strong>
          <span>Organiza o dinheiro à tua maneira</span>
        </button>
      </div>
      <p className="footnote">
        As carteiras são registos manuais. Não existe ligação a bancos, M-Pesa ou e-Mola.
      </p>
    </>
  );
}
