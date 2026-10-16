import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { db } from '../database/db';
import { finance } from '../services/finance';
import { initialSnapshot } from '../database/seed';
import { walletBalance } from '../services/finance';
vi.mock('../hooks/usePWA', () => ({
  usePWA: () => ({ offlineReady: true, needRefresh: false, error: '', update: vi.fn() }),
}));
beforeEach(async () => {
  await finance.restore(initialSnapshot());
  location.hash = '';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
describe('fluxos principais', () => {
  it('mostra uma instalação vazia sem movimentos fictícios', async () => {
    render(<App />);
    expect(await screen.findByText('Um novo começo para as tuas finanças')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar primeiro movimento' })).toBeEnabled();
  });
  it('regista receita e despesa através dos formulários e actualiza o saldo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Nova receita' }));
    let dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Valor em meticais'), '1000,00');
    await user.click(dialog.getByRole('button', { name: 'Adicionar movimento' }));
    await screen.findByText('Movimento adicionado.');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Nova despesa' }));
    dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Valor em meticais'), '25,50');
    await user.click(dialog.getByRole('button', { name: 'Adicionar movimento' }));
    await waitFor(async () => expect((await db.snapshot()).movements).toHaveLength(2));
    expect(walletBalance(await db.snapshot(), 'wallet-0')).toBe(97450);
  });
  it('rejeita um valor com precisão inválida sem gravar um movimento', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Nova despesa' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Valor em meticais'), '1,001');
    await user.click(dialog.getByRole('button', { name: 'Adicionar movimento' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent('duas casas decimais');
    expect((await db.snapshot()).movements).toHaveLength(0);
  });
  it('oculta os valores e persiste a preferência', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Ocultar valores' }));
    expect(await screen.findByRole('button', { name: 'Mostrar valores' })).toBeInTheDocument();
    expect((await db.snapshot()).preferences.hidden).toBe(true);
    expect(screen.queryByText(/0,00 MT/)).not.toBeInTheDocument();
  });
});
