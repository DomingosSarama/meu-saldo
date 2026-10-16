# Arquitectura

## Execução

A aplicação é estática e usa React + TypeScript, Vite e Dexie. O build publica apenas HTML, CSS, JavaScript e ícones no GitHub Pages. Não há API financeira, autenticação ou telemetria. Os ícones Lucide, os gráficos SVG e as fontes do sistema funcionam sem pedidos externos.

As páginas são seleccionadas por fragmentos de URL. Os hooks observam rede, IndexedDB (`useLiveQuery`) e actualizações PWA. Os componentes de formulário não escrevem directamente nas tabelas; usam `FinanceService`.

## Modelo de dados — versão 1

| Tabela        | Dados principais                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `categories`  | ID, nome, tipo receita/despesa, ícone, cor e subcategorias                                                  |
| `wallets`     | ID, nome, saldo inicial em centavos e cor                                                                   |
| `movements`   | ID, tipo, valor em centavos, origem, destino opcional, categoria, data ISO, descrição, método e observações |
| `budgets`     | ID, mês local `AAAA-MM`, categoria opcional e limite em centavos                                            |
| `preferences` | Tema, ocultação de valores e última exportação iniciada                                                     |

IDs são estáveis. A primeira abertura cria apenas categorias, carteiras com saldo zero e preferências. Nunca cria movimentos demonstrativos. A versão Dexie 1 define o esquema inicial; migrações futuras devem usar `.version(2).stores(...).upgrade(...)`, preservar dados e ter testes de actualização. Não há versões anteriores da aplicação a migrar nesta entrega.

## Dinheiro e consistência

- Todos os montantes guardados são **inteiros em centavos**. O formulário converte separadamente a parte inteira e os dois dígitos decimais. Não usa multiplicação de um número decimal por 100.
- O limite individual é 9 000 000 000 000 centavos. A soma absoluta de montantes e saldos iniciais tem de ser um inteiro seguro de JavaScript.
- Saldo = saldo inicial + receitas − despesas − transferências enviadas + transferências recebidas.
- Uma transferência é **um único registo**, com origem e destino diferentes. Não entra nos totais globais de receitas/despesas.
- Não há coluna de saldo mutável a sincronizar. Edições e eliminações reflectem-se automaticamente nos cálculos.
- O histórico pode produzir saldo negativo; não impede registar uma despesa real.
- Datas são guardadas em ISO com fuso; apresentação, agrupamento mensal e filtros usam o fuso local do dispositivo.

Todas as mutações lêem e validam o estado completo dentro de uma transacção Dexie `rw`, abrangendo todas as tabelas. Só depois são persistidas. As escritas são serializadas entre abas. A versão inicial privilegia simplicidade e integridade: lê/valida o histórico completo e regrava as tabelas na transacção. Em históricos muito grandes isto terá custo linear e deverá evoluir para escritas incrementais e paginação, mantendo os invariantes e os testes de rollback.

## Backup

Envelope JSON: `app: "MeuSaldo"`, `version: 1`, `exportedAt` ISO e `data` com as cinco tabelas. O importador rejeita campos inesperados, montantes fraccionários, versões desconhecidas, IDs repetidos, referências inexistentes e tipos incompatíveis. Limites: 20 MB, 100 000 movimentos, 500 categorias, 100 carteiras e 5 000 orçamentos. Estes limites são de validação, não uma garantia de desempenho nesses volumes.

A interface mostra contagens e data antes de restaurar e exige confirmação explícita. A substituição é atómica: se qualquer inserção falhar, a transacção reverte e preserva os dados anteriores. Não há importação parcial nem merge de backups.

A Web Share API permite guardar em Ficheiros quando suportada; o fallback usa download Blob. A data da última exportação indica que o ficheiro foi preparado/partilhado, não prova que ficou guardado no destino. O CSV escapa aspas e neutraliza fórmulas introduzidas em texto. O CSV é apenas exportação, não um formato de restauração.

## PWA

`vite-plugin-pwa`/Workbox gera o manifest e o Service Worker. O precache inclui HTML, JavaScript, CSS e ícones. `base`, scope, start URL e fallback usam `/meu-saldo/`. O registo usa modo prompt: a versão nova só é activada depois da acção do utilizador, evitando recarregar formulários abertos.

O pedido de persistência é opcional e depende do navegador. Cache de recursos e IndexedDB têm ciclos de vida distintos: poder abrir offline não garante a preservação eterna do histórico. A aplicação não encripta a base de dados ou os backups; quem tiver acesso ao dispositivo/navegador pode ler os dados.
