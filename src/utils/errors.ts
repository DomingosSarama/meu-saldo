export function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) return 'Não foi possível concluir a operação. Tenta novamente.';
  if (error.name === 'QuotaExceededError')
    return 'O dispositivo não tem espaço suficiente. Preserva um backup e liberta espaço antes de tentar novamente.';
  if (
    ['SecurityError', 'InvalidStateError', 'DatabaseClosedError', 'OpenFailedError'].includes(
      error.name,
    )
  )
    return 'O armazenamento local está indisponível. Verifica as permissões do navegador e volta a abrir a aplicação.';
  if (error.name === 'ZodError') return 'Verifica os dados introduzidos e tenta novamente.';
  return error.message;
}
