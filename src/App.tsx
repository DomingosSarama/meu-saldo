import { Component, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  Shapes,
  Settings as SettingsIcon,
  ChartNoAxesCombined,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  WifiOff,
  ShieldCheck,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { db } from './database/db';
import { finance } from './services/finance';
import type { Backup } from './services/backup';
import {
  type Budget,
  type Category,
  type Movement,
  type MovementKind,
  type Snapshot,
  type Wallet as WalletModel,
} from './models/finance';
import { useOnline } from './hooks/useOnline';
import { usePWA } from './hooks/usePWA';
import { monthKey, monthLabel } from './utils/dates';
import { Dashboard } from './pages/Dashboard';
import { Movements } from './pages/Movements';
import { Wallets } from './pages/Wallets';
import { Categories } from './pages/Categories';
import { Budgets } from './pages/Budgets';
import { Settings } from './pages/Settings';
import { Modal } from './components/Modal';
import {
  AsyncForm,
  BudgetForm,
  CategoryForm,
  MovementForm,
  RemoveCategoryForm,
  WalletForm,
} from './components/Forms';

const pages = {
  dashboard: {
    label: 'Visão geral',
    subtitle: 'Um olhar tranquilo sobre as tuas finanças.',
    icon: LayoutDashboard,
  },
  movements: {
    label: 'Movimentos',
    subtitle: 'Cada entrada e saída, no lugar certo.',
    icon: ArrowRightLeft,
  },
  wallets: { label: 'Carteiras', subtitle: 'Todo o teu dinheiro, bem organizado.', icon: Wallet },
  budgets: {
    label: 'Orçamentos',
    subtitle: 'Mais intenção. Mais tranquilidade.',
    icon: ChartNoAxesCombined,
  },
  categories: { label: 'Categorias', subtitle: 'Organiza o teu mundo financeiro.', icon: Shapes },
  settings: {
    label: 'Definições',
    subtitle: 'A tua aplicação, à tua maneira.',
    icon: SettingsIcon,
  },
};
type Page = keyof typeof pages;
type DialogState =
  | { type: 'movement'; existing?: Movement; kind?: MovementKind }
  | { type: 'wallet'; existing?: WalletModel }
  | { type: 'category'; existing?: Category }
  | { type: 'budget'; existing?: Budget }
  | { type: 'remove-category'; category: Category }
  | { type: 'restore'; backup: Backup }
  | { type: 'confirm'; title: string; message: string; action: () => Promise<void>; label: string };
function currentPage(): Page {
  const hash = location.hash.slice(1);
  return Object.hasOwn(pages, hash) ? (hash as Page) : 'dashboard';
}
export default function App() {
  const s = useLiveQuery(() => db.snapshot(), []);
  if (!s)
    return (
      <div className="loading-screen" role="status">
        <span className="logo-mark">m.</span>
        <p>A abrir o teu espaço financeiro…</p>
      </div>
    );
  return <FinanceApp s={s} />;
}
function FinanceApp({ s }: { s: Snapshot }) {
  const [page, setPage] = useState<Page>(currentPage);
  const [month, setMonth] = useState(monthKey());
  const [modal, setModal] = useState<DialogState | null>(null);
  const [walletFilter, setWalletFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const online = useOnline();
  const pwa = usePWA();
  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);
  const done = (message: string) => {
    setModal(null);
    notify(message);
  };
  const add = (kind: MovementKind = 'expense') => setModal({ type: 'movement', kind });
  const edit = (existing: Movement) => setModal({ type: 'movement', existing });
  function removeMovement(movement: Movement) {
    const label =
      movement.description ||
      s.categories.find((c) => c.id === movement.categoryId)?.name ||
      'Transferência';
    setModal({
      type: 'confirm',
      title: 'Eliminar movimento?',
      message: `Vais eliminar «${label}». Os saldos serão recalculados. Esta operação não pode ser desfeita.`,
      label: 'Eliminar movimento',
      action: async () => {
        await finance.deleteMovement(movement.id);
        done('Movimento eliminado.');
      },
    });
  }
  function navigate(next: Page) {
    setPage(next);
    location.hash = next;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => {
    const sync = () => setPage(currentPage());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = s.preferences.theme;
    document.documentElement.style.colorScheme = s.preferences.theme;
  }, [s.preferences.theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.error ? 12000 : 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function moveMonth(offset: number) {
    const next = new Date(`${month}-01T12:00`);
    next.setMonth(next.getMonth() + offset);
    if (next.getFullYear() >= 1900 && next.getFullYear() <= 9999) setMonth(monthKey(next));
  }
  const action =
    page === 'wallets'
      ? () => setModal({ type: 'wallet' })
      : page === 'categories'
        ? () => setModal({ type: 'category' })
        : page === 'budgets'
          ? () => setModal({ type: 'budget' })
          : () => add();
  const actionLabel =
    page === 'wallets'
      ? 'Nova carteira'
      : page === 'categories'
        ? 'Nova categoria'
        : page === 'budgets'
          ? 'Novo orçamento'
          : 'Novo movimento';
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
          document.getElementById('main')?.scrollIntoView();
        }}
      >
        Saltar para o conteúdo
      </a>
      <aside className="sidebar">
        <a
          href="#dashboard"
          className="brand"
          onClick={() => navigate('dashboard')}
          aria-label="MeuSaldo, visão geral"
        >
          <span className="logo-mark">
            m<span>.</span>
          </span>
          <span>
            meu<span>saldo</span>
            <small>AS TUAS FINANÇAS. CONTIGO.</small>
          </span>
        </a>
        <p className="nav-label">O TEU ESPAÇO</p>
        <nav aria-label="Navegação principal">
          {(Object.entries(pages) as [Page, (typeof pages)[Page]][]).map(
            ([key, { label, icon: Icon }]) => (
              <button
                key={key}
                className={page === key ? 'active' : ''}
                aria-current={page === key ? 'page' : undefined}
                onClick={() => {
                  setWalletFilter('');
                  navigate(key);
                }}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
                {page === key && <span className="nav-indicator" />}
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-badge">
            <ShieldCheck size={22} />
            <span>
              <strong>O teu espaço é privado</strong>
              <small>Dados guardados no dispositivo</small>
            </span>
          </div>
          <div className="sidebar-footer">
            <span>
              MeuSaldo <small>v1.0</small>
            </span>
            <span className="green">MZN</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="topbar-breadcrumb">
            O meu espaço <span>/</span>
            <strong>{pages[page].label}</strong>
          </span>
          <span className="connection-status">
            <span className={`status-dot ${online ? '' : 'offline'}`} />
            {online ? 'Guardado neste dispositivo' : 'Sem internet · dados locais'}
            {!online && <WifiOff size={14} />}
          </span>
          <span className="avatar" aria-label="Perfil local">
            M
          </span>
        </header>
        <main id="main" tabIndex={-1} className="main-content">
          <div className="page-header">
            <div>
              <p className="eyebrow">
                {page === 'dashboard'
                  ? 'AS TUAS FINANÇAS, NAS TUAS MÃOS'
                  : 'O TEU ESPAÇO FINANCEIRO'}
              </p>
              <h1>
                {pages[page].label}
                <span className="heading-dot">.</span>
              </h1>
              <p className="page-subtitle">{pages[page].subtitle}</p>
            </div>
            <div className="page-header-actions">
              {(page === 'dashboard' || page === 'budgets') && (
                <div className="month-picker">
                  <button
                    className="icon-button"
                    aria-label="Mês anterior"
                    onClick={() => moveMonth(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <label>
                    <span className="sr-only">Mês do resumo</span>
                    <input
                      type="month"
                      required
                      aria-label="Mês do resumo"
                      value={month}
                      onChange={(e) => {
                        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value))
                          setMonth(e.target.value);
                      }}
                    />
                    <span aria-hidden="true">{monthLabel(month)}</span>
                  </label>
                  <button
                    className="icon-button"
                    aria-label="Mês seguinte"
                    onClick={() => moveMonth(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              {page !== 'settings' && (
                <button className="button primary header-add" onClick={action}>
                  <Plus size={18} />
                  <span>{actionLabel}</span>
                </button>
              )}
            </div>
          </div>
          {pwa.needRefresh && (
            <div className="update-banner">
              <RefreshCw size={18} />
              <span>Uma nova versão está pronta.</span>
              <button
                className="text-button"
                onClick={() => {
                  if (modal) {
                    notify('Conclui ou fecha o formulário antes de actualizar.');
                    return;
                  }
                  setModal({
                    type: 'confirm',
                    title: 'Actualizar o MeuSaldo?',
                    message:
                      'A aplicação será recarregada. Os dados já guardados no dispositivo serão preservados.',
                    label: 'Actualizar agora',
                    action: async () => {
                      await pwa.update();
                    },
                  });
                }}
              >
                Actualizar
              </button>
            </div>
          )}
          {pwa.error && (
            <div className="alert warning" role="status">
              {pwa.error}
            </div>
          )}
          {page === 'dashboard' && (
            <Dashboard
              s={s}
              month={month}
              add={add}
              edit={edit}
              remove={removeMovement}
              navigate={navigate}
              toggleHidden={() =>
                finance
                  .setPreferences({ hidden: !s.preferences.hidden })
                  .catch(() => notify('Não foi possível guardar a preferência.', true))
              }
              setBudget={() =>
                setModal({
                  type: 'budget',
                  existing: s.budgets.find((b) => b.month === month && !b.categoryId),
                })
              }
            />
          )}
          {page === 'movements' && (
            <Movements
              key={walletFilter}
              s={s}
              edit={edit}
              remove={removeMovement}
              add={() => add()}
              initialWallet={walletFilter}
            />
          )}
          {page === 'wallets' && (
            <Wallets
              s={s}
              edit={(existing) => setModal({ type: 'wallet', existing })}
              history={(id) => {
                setWalletFilter(id);
                navigate('movements');
              }}
              transfer={() => add('transfer')}
              add={() => setModal({ type: 'wallet' })}
            />
          )}
          {page === 'categories' && (
            <Categories
              s={s}
              edit={(existing) => setModal({ type: 'category', existing })}
              remove={(category) => setModal({ type: 'remove-category', category })}
            />
          )}
          {page === 'budgets' && (
            <Budgets
              s={s}
              month={month}
              edit={(existing) => setModal({ type: 'budget', existing })}
              add={() => setModal({ type: 'budget' })}
            />
          )}
          {page === 'settings' && (
            <Settings
              s={s}
              notify={notify}
              restore={(backup) => setModal({ type: 'restore', backup })}
              navigate={navigate}
              offlineReady={pwa.offlineReady}
              requestPersistence={async () => {
                try {
                  if (!navigator.storage?.persist) {
                    notify(
                      'Este navegador não permite pedir persistência. Mantém backups regulares.',
                    );
                    return;
                  }
                  const granted = await navigator.storage.persist();
                  notify(
                    granted
                      ? 'Armazenamento persistente autorizado. Continua a fazer backups.'
                      : 'O navegador não concedeu persistência. Mantém backups regulares.',
                  );
                } catch {
                  notify('Não foi possível pedir persistência.', true);
                }
              }}
            />
          )}
          <footer className="main-footer">
            <span>
              <span className="mini-logo">m.</span>Um pouco mais de controlo. Um pouco mais de
              tranquilidade.
            </span>
            <span>
              Feito para o teu dia a dia <ArrowUpRight size={12} />
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação móvel">
        {(['dashboard', 'movements', 'wallets', 'categories', 'settings'] as Page[]).map((key) => {
          const Icon = pages[key].icon;
          return (
            <button
              key={key}
              className={page === key ? 'active' : ''}
              aria-current={page === key ? 'page' : undefined}
              onClick={() => {
                setWalletFilter('');
                navigate(key);
              }}
            >
              <Icon size={21} />
              <span>{key === 'dashboard' ? 'Início' : pages[key].label}</span>
            </button>
          );
        })}
      </nav>
      {toast && (
        <div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
        >
          <CheckCircle2 size={20} />
          <span>{toast.message}</span>
          <button className="icon-button" onClick={() => setToast(null)} aria-label="Fechar aviso">
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          key={modal.type}
          title={
            modal.type === 'movement'
              ? modal.existing
                ? 'Editar movimento'
                : 'Novo movimento'
              : modal.type === 'wallet'
                ? modal.existing
                  ? 'Editar carteira'
                  : 'Nova carteira'
                : modal.type === 'category'
                  ? modal.existing
                    ? 'Editar categoria'
                    : 'Nova categoria'
                  : modal.type === 'remove-category'
                    ? 'Eliminar categoria'
                    : modal.type === 'budget'
                      ? 'Definir orçamento'
                      : modal.type === 'restore'
                        ? 'Restaurar backup'
                        : modal.title
          }
          onClose={() => setModal(null)}
        >
          {modal.type === 'movement' && (
            <MovementForm
              s={s}
              existing={modal.existing}
              initialKind={modal.kind}
              done={done}
              onDelete={() => removeMovement(modal.existing!)}
            />
          )}
          {modal.type === 'wallet' && <WalletForm existing={modal.existing} done={done} />}
          {modal.type === 'category' && <CategoryForm existing={modal.existing} done={done} />}
          {modal.type === 'remove-category' && (
            <RemoveCategoryForm s={s} category={modal.category} done={done} />
          )}
          {modal.type === 'budget' && (
            <BudgetForm
              s={s}
              month={month}
              existing={modal.existing}
              done={done}
              onDelete={() => {
                const id = modal.existing!.id;
                setModal({
                  type: 'confirm',
                  title: 'Eliminar orçamento?',
                  message: 'O limite será removido. Os movimentos serão preservados.',
                  label: 'Eliminar orçamento',
                  action: async () => {
                    await finance.deleteBudget(id);
                    done('Orçamento eliminado.');
                  },
                });
              }}
            />
          )}
          {modal.type === 'confirm' && (
            <AsyncForm danger label={modal.label} onSubmit={modal.action}>
              <p>{modal.message}</p>
              <button className="button secondary" type="button" onClick={() => setModal(null)}>
                Cancelar
              </button>
            </AsyncForm>
          )}
          {modal.type === 'restore' && (
            <AsyncForm
              label="Confirmar e substituir dados"
              danger
              onSubmit={async () => {
                await finance.restore(modal.backup.data);
                done('Backup restaurado com sucesso.');
              }}
            >
              <p>
                Backup exportado em{' '}
                <strong>{new Date(modal.backup.exportedAt).toLocaleString('pt-MZ')}</strong>.
              </p>
              <div className="restore-preview">
                {[
                  ['Movimentos', modal.backup.data.movements.length],
                  ['Carteiras', modal.backup.data.wallets.length],
                  ['Categorias', modal.backup.data.categories.length],
                  ['Orçamentos', modal.backup.data.budgets.length],
                ].map(([label, count]) => (
                  <span key={label}>
                    <strong>{count}</strong>
                    {label}
                  </span>
                ))}
              </div>
              <p className="alert warning">
                Os dados actuais deste dispositivo serão substituídos. Exporta primeiro um backup se
                os quiseres preservar.
              </p>
              <label className="checkbox-label">
                <input type="checkbox" required />
                Compreendo e autorizo a substituição dos dados locais.
              </label>
              <button className="button secondary" type="button" onClick={() => setModal(null)}>
                Cancelar
              </button>
            </AsyncForm>
          )}
        </Modal>
      )}
    </div>
  );
}
export class StorageBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="loading-screen">
        <ShieldCheck size={40} />
        <h1>Não foi possível abrir os dados</h1>
        <p>
          Verifica se o armazenamento do navegador está disponível e se existe espaço livre.
          Preserva os dados do dispositivo e os teus backups.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Tentar novamente
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
