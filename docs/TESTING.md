# Qualidade e segurança

## Verificações automatizadas

```sh
npm ci
npm run check
npm audit --audit-level=moderate
```

`check` executa ESLint (sem warnings), Vitest e TypeScript + build Vite/PWA. O lockfile mantém as versões resolvidas. Os workflows repetem estas verificações. A auditoria usa a base pública de vulnerabilidades npm e não constitui uma certificação de segurança.

Os testes Vitest cobrem conversão monetária, receita/despesa, edição/eliminação, transferências, saldos, referências inválidas, categorias personalizadas e reclassificação, IndexedDB reaberto, orçamentos por mês/categoria, backup completo, versões inválidas, duplicados, rollback numa falha de armazenamento, neutralização de fórmulas CSV e os formulários principais da interface. Os testes IndexedDB usam `fake-indexeddb`, não o motor Safari.

## Verificação em navegador

Os testes Playwright em `e2e/finance.pw.ts` repetem os fluxos de registo, transferências, operações offline, exportação/recuperação, categorias em Outros, carteiras, pesquisa e confirmação/cancelamento da eliminação. Um terceiro percurso verifica o botão Eliminar directamente na lista, o alvo de toque de pelo menos 44 px e a persistência da eliminação offline em 320 px. Usam um contexto isolado com emulação de iPhone e apenas dados sintéticos de teste. Também correm em GitHub Actions antes de publicar.

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

Para usar um Chromium já instalado, definir `MEUSALDO_CHROMIUM_PATH` para o caminho do executável. O Playwright arranca `npm run preview` automaticamente. Os relatórios e traces ficam ignorados pelo Git e podem conter os dados sintéticos dos testes.

Verificar a **versão de produção** com `npm run build && npm run preview`. O servidor `dev` não instala o Service Worker. Usar um perfil de teste isolado, sem dados pessoais.

Percurso recomendado: instalação vazia → receita → despesa com subcategoria → transferência → recarregamento offline → despesa offline → editar → orçamento → exportar JSON → importar ficheiro inválido → restaurar backup com confirmação → tema → ocultar valores. Confirmar a ausência de erros de consola e de deslocamento horizontal em ecrãs pequenos.

## Verificações manuais pendentes no dispositivo

- Instalação via Safari, safe areas, teclado, selectores nativos e reabertura no ecrã principal.
- VoiceOver, contraste, navegação por teclado e preferências de movimento reduzido.
- Partilha para Ficheiros/iCloud Drive, cancelamento e importação real do ficheiro guardado.
- Persistência após reinício do iPhone e resposta a baixo armazenamento.
- Actualização entre duas versões publicadas, mantendo o histórico.

A emulação móvel em Chromium não substitui Safari/iOS real. Não declarar estes pontos como verificados sem os executar nesse dispositivo.

## Medidas implementadas

Validação Zod de entradas e de backups, valores inteiros com limites de precisão, relações validadas dentro de transacções, React sem HTML injectado, CSP limitada à própria origem, exportação CSV protegida contra fórmulas, ausência de segredos ou pedidos externos de dados financeiros e confirmação das operações destrutivas.

O modo de ocultar valores é visual; IndexedDB e backups não estão encriptados. A CSP permite estilos inline para cores/gráficos e WebSocket local para desenvolvimento. O cache offline exige um primeiro carregamento completo. A perda dos dados do dispositivo só é recuperável com um backup externo.

## Resultado verificado nesta entrega

Em 16 de Outubro de 2026 passaram lint, 27 testes Vitest de dados/componentes, os 3 percursos Playwright, TypeScript, build PWA e auditoria npm. A auditoria final não indicou vulnerabilidades conhecidas. O percurso de ponta a ponta em Chromium confirmou reabertura offline, gravação/edição offline, backup JSON, rejeição de ficheiro inválido, restauração confirmada, tema e ocultação de valores, sem erros de execução. O layout foi inspeccionado em desktop e em 390 px; também foi verificado sem deslocamento horizontal em 320 px. Estes resultados não substituem os testes pendentes em Safari/iPhone real acima.

O build pode emitir dois avisos de anotações `@__PURE__` da biblioteca Zod, removidas pelo Rollup. Não são erros de TypeScript nem impedem o precache ou o funcionamento. Não foram ocultados na configuração.
