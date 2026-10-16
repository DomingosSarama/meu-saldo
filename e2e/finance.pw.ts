import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function start(page: Page) {
  await page.goto('./');
  await expect(page.getByText('Um novo começo para as tuas finanças')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
}
async function fillAmount(page: Page, amount: string) {
  await page.getByRole('dialog').getByLabel('Valor em meticais', { exact: true }).fill(amount);
}
async function saveMovement(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Adicionar movimento', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
function mobileNav(page: Page, name: string) {
  return page
    .getByRole('navigation', { name: 'Navegação móvel' })
    .getByRole('button', { name, exact: true });
}

test('registos, transferências, persistência offline e recuperação de backup', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  await page.getByRole('button', { name: 'Nova receita', exact: true }).click();
  await fillAmount(page, '10000,10');
  await page
    .getByRole('dialog')
    .getByLabel('Descrição', { exact: false })
    .fill('Receita automatizada');
  await saveMovement(page);
  await page.getByRole('button', { name: 'Nova despesa', exact: true }).click();
  await fillAmount(page, '250,50');
  await page
    .getByRole('dialog')
    .getByLabel('Subcategoria', { exact: true })
    .selectOption('Supermercado');
  await page
    .getByRole('dialog')
    .getByLabel('Descrição', { exact: false })
    .fill('Despesa automatizada');
  await saveMovement(page);
  await page.getByRole('button', { name: 'Transferir', exact: true }).click();
  await fillAmount(page, '1000');
  await page.getByRole('dialog').getByLabel('Carteira de destino').selectOption('wallet-1');
  await saveMovement(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Receita automatizada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nova despesa', exact: true }).click();
  await fillAmount(page, '0,10');
  await page.getByRole('dialog').getByLabel('Descrição', { exact: false }).fill('Gravada offline');
  await saveMovement(page);
  await page.reload();
  await page.getByRole('button').filter({ hasText: 'Gravada offline' }).click();
  await fillAmount(page, '0,20');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar alterações' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Definir orçamento mensal' }).click();
  await page.getByRole('dialog').getByLabel('Limite em MT').fill('5000');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await mobileNav(page, 'Definições').click();
  await expect(page.getByText('Recursos preparados para offline')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup JSON', exact: false }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  const backup = JSON.parse(await readFile(backupPath!, 'utf8'));
  expect(backup.data.movements).toHaveLength(4);
  expect(
    backup.data.movements.reduce(
      (n: number, m: { kind: string; amount: number }) =>
        n + (m.kind === 'income' ? m.amount : m.kind === 'expense' ? -m.amount : 0),
      0,
    ),
  ).toBe(974940);
  await page.getByRole('button', { name: 'Claro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('Ficheiro de backup JSON').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999}'),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'Backup inválido' })).toBeVisible();
  await page.getByLabel('Ficheiro de backup JSON').setInputFiles(backupPath!);
  await expect(page.getByRole('dialog')).toContainText('Restaurar backup');
  await expect(page.getByRole('dialog').getByRole('checkbox')).not.toBeChecked();
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar e substituir dados' })
    .click();
  await expect(page.getByText('Backup restaurado com sucesso.')).toBeVisible();
  await mobileNav(page, 'Início').click();
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Ocultar valores' }).click();
  await expect(page.locator('.balance-value')).not.toContainText('MT');
  expect(errors).toEqual([]);
});

test('categoria personalizada em Outros, carteira, filtros e eliminação confirmada', async ({
  page,
}) => {
  await start(page);
  await mobileNav(page, 'Carteiras').click();
  await page.getByRole('button', { name: 'Nova carteira', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Nome da carteira').fill('Poupanças de teste');
  await page.getByRole('dialog').getByLabel('Saldo inicial em MT').fill('3000');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await mobileNav(page, 'Início').click();
  await page.getByRole('button', { name: 'Nova despesa', exact: true }).click();
  await fillAmount(page, '200');
  await page
    .getByRole('dialog')
    .getByLabel('Categoria', { exact: true })
    .selectOption({ label: 'Outros' });
  await page.getByRole('dialog').getByRole('button', { name: 'Criar nova categoria' }).click();
  await page.getByRole('dialog').getByLabel('Nome da categoria').fill('Animais de teste');
  await saveMovement(page);
  await mobileNav(page, 'Categorias').click();
  await expect(page.getByRole('heading', { name: 'Animais de teste' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar Animais de teste', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Reclassificar para').selectOption('expense-0');
  await page.getByRole('dialog').getByRole('button', { name: 'Reclassificar e eliminar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Animais de teste' })).toHaveCount(0);
  await mobileNav(page, 'Movimentos').click();
  await page.getByLabel('Pesquisar movimentos').fill('Alimentação');
  const row = page.locator('.movement-row');
  await expect(row).toHaveCount(1);
  await row.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar movimento' }).click();
  await expect(page.getByRole('dialog')).toContainText('Eliminar movimento?');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(row).toHaveCount(1);
  await row.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar movimento' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Eliminar movimento', exact: true })
    .click();
  await expect(page.getByText('Nenhum movimento encontrado')).toBeVisible();
});
