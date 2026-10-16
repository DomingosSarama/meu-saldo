import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Sun,
  Moon,
  ShieldCheck,
  Smartphone,
  FolderHeart,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import type { Snapshot } from '../models/finance';
import { finance } from '../services/finance';
import { db } from '../database/db';
import {
  createBackup,
  exportCSV,
  MAX_BACKUP_BYTES,
  parseBackup,
  saveFile,
  type Backup,
} from '../services/backup';
import { dateInput } from '../utils/dates';
import { friendlyError } from '../utils/errors';
type Props = {
  s: Snapshot;
  notify: (message: string, error?: boolean) => void;
  restore: (backup: Backup) => void;
  navigate: (page: 'categories' | 'budgets') => void;
  offlineReady: boolean;
  requestPersistence: () => Promise<void>;
};
export function Settings({
  s,
  notify,
  restore,
  navigate,
  offlineReady,
  requestPersistence,
}: Props) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function exportData(csv = false) {
    setBusy(true);
    try {
      const snapshot = await db.snapshot();
      const day = dateInput().slice(0, 10);
      await saveFile(
        csv ? exportCSV(snapshot) : createBackup(snapshot),
        `meusaldo-${csv ? 'movimentos' : 'backup'}-${day}.${csv ? 'csv' : 'json'}`,
        csv ? 'text/csv;charset=utf-8' : 'application/json',
      );
      if (!csv) await finance.setPreferences({ lastExportAt: new Date().toISOString() });
      notify(
        csv
          ? 'CSV preparado para guardar.'
          : 'Backup preparado. Confirma que o guardaste nos teus ficheiros.',
      );
    } catch (error) {
      notify(friendlyError(error), true);
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('O backup excede 20 MB.');
      restore(parseBackup(await file.text()));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível ler o ficheiro.', true);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <div className="settings-layout">
      <div className="settings-main">
        <section className="panel">
          <div className="settings-heading">
            <FolderHeart size={24} />
            <div>
              <p className="eyebrow">CUIDA DO TEU HISTÓRICO</p>
              <h2>Backups e recuperação</h2>
            </div>
          </div>
          <p className="muted">
            Os dados ficam neste navegador. Faz backups regularmente e guarda uma cópia em Ficheiros
            ou no iCloud Drive.
          </p>
          <div className="settings-actions">
            <button className="setting-action" disabled={busy} onClick={() => exportData()}>
              <Download size={20} />
              <span>
                <strong>Exportar backup JSON</strong>
                <small>Uma cópia completa dos teus dados</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
            <button
              className="setting-action"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <Upload size={20} />
              <span>
                <strong>Restaurar um backup</strong>
                <small>Validar e pré-visualizar antes de substituir</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
            <button
              className="setting-action"
              disabled={busy || !s.movements.length}
              onClick={() => exportData(true)}
            >
              <FileSpreadsheet size={20} />
              <span>
                <strong>Exportar movimentos CSV</strong>
                <small>Abre o histórico numa folha de cálculo</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          </div>
          <input
            ref={input}
            hidden
            type="file"
            accept=".json,application/json"
            aria-label="Ficheiro de backup JSON"
            onChange={(e) => importFile(e.target.files?.[0])}
          />
          <p className="footnote">
            {busy
              ? 'A preparar ficheiro…'
              : s.preferences.lastExportAt
                ? `Última exportação: ${new Date(s.preferences.lastExportAt).toLocaleString('pt-MZ')}`
                : 'Ainda não exportaste um backup neste dispositivo.'}
          </p>
          <p className="alert warning">
            Os backups contêm informação financeira sem encriptação. Guarda-os num local privado.
          </p>
        </section>
        <section className="panel">
          <div className="settings-heading">
            <Sun size={23} />
            <h2>À tua maneira</h2>
          </div>
          <div className="setting-line">
            <div>
              <strong>Aparência</strong>
              <p className="muted">Escolhe o ambiente que preferes.</p>
            </div>
            <div className="segmented">
              <button
                aria-pressed={s.preferences.theme === 'dark'}
                className={s.preferences.theme === 'dark' ? 'active' : ''}
                onClick={() =>
                  finance
                    .setPreferences({ theme: 'dark' })
                    .catch(() => notify('Não foi possível guardar o tema.', true))
                }
              >
                <Moon size={16} />
                Escuro
              </button>
              <button
                aria-pressed={s.preferences.theme === 'light'}
                className={s.preferences.theme === 'light' ? 'active' : ''}
                onClick={() =>
                  finance
                    .setPreferences({ theme: 'light' })
                    .catch(() => notify('Não foi possível guardar o tema.', true))
                }
              >
                <Sun size={16} />
                Claro
              </button>
            </div>
          </div>
          <div className="settings-links">
            <button className="text-button" onClick={() => navigate('categories')}>
              Gerir categorias <ArrowUpRight size={15} />
            </button>
            <button className="text-button" onClick={() => navigate('budgets')}>
              Gerir orçamentos <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </div>
      <aside>
        <section className="panel">
          <div className="settings-heading">
            <Smartphone size={24} />
            <h2>MeuSaldo no iPhone</h2>
          </div>
          <p className="muted">
            No Safari, abre o menu <strong>Partilhar</strong> e escolhe{' '}
            <strong>Adicionar ao ecrã principal</strong>. Abre a aplicação instalada uma vez com
            internet e aguarda a confirmação offline.
          </p>
          <ol className="install-steps">
            <li>Abre no Safari</li>
            <li>Partilhar → Adicionar ao ecrã principal</li>
            <li>Guarda o teu primeiro backup</li>
          </ol>
          <p className={`status-pill ${offlineReady ? 'green' : ''}`}>
            <span className="status-dot" />
            {offlineReady ? 'Recursos preparados para offline' : 'A verificar os recursos offline'}
          </p>
        </section>
        <section className="panel storage-info">
          <div className="settings-heading">
            <Database size={24} />
            <h2>Dados locais</h2>
          </div>
          <p className="muted">
            O sistema ou a limpeza do navegador podem remover os dados. O Safari e a aplicação
            instalada podem usar espaços de armazenamento diferentes. Usa um backup para mover o
            histórico.
          </p>
          <button className="button secondary" onClick={requestPersistence}>
            Pedir armazenamento persistente
          </button>
        </section>
        <div className="privacy-note">
          <ShieldCheck size={20} />
          <p>
            Sem contas. Sem subscrições.
            <br />
            As tuas finanças, nas tuas mãos.
          </p>
        </div>
      </aside>
    </div>
  );
}
