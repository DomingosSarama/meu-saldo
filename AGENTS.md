# MeuSaldo — instruções de manutenção

- Trabalhar apenas neste repositório. Não fazer merge nem alterar o destino de publicação sem autorização.
- React + TypeScript estrito. Interface e mensagens em português; moeda MZN.
- Nunca adicionar movimentos fictícios à instalação inicial.
- Guardar dinheiro em centavos inteiros. Usar `parseMoney`; nunca `parseFloat(valor) * 100`.
- Os saldos são derivados do histórico. Transferências internas são um único movimento e não contam como receita/despesa.
- Todas as escritas passam por `FinanceService` e validação dentro de uma transacção IndexedDB.
- Novas alterações de esquema exigem uma versão Dexie adicional, migração explícita e testes com dados da versão anterior. Nunca editar silenciosamente um esquema já publicado.
- Preservar validação, pré-visualização e confirmação da restauração. O importador deve rejeitar versões desconhecidas e garantir rollback.
- Não enviar dados financeiros, backups, credenciais ou telemetria para servidores. Não usar CDNs em funcionalidades quotidianas.
- Categorias removidas exigem reclassificação atómica do histórico. Operações destrutivas exigem confirmação na interface.
- Manter safe areas, fontes de 16 px nos formulários móveis, acessibilidade, modo claro/escuro e funcionamento offline.
- Antes de finalizar: `npm run check` e `npm audit --audit-level=moderate`; documentar limites de verificação. Testar a PWA a partir do build, não do servidor de desenvolvimento.
- Não commitar `dist`, `node_modules`, backups nem ficheiros pessoais. Manter `package-lock.json` versionado.
- Documentar a funcionalidade final e limitações conhecidas. Funcionalidades das fases seguintes devem ser identificadas como pendentes até estarem implementadas e testadas.
