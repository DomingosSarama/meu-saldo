# MeuSaldo

Gestão de finanças pessoais em português e meticais (MZN/MT), pensada para iPhone. React + TypeScript, IndexedDB e PWA; sem backend, conta online, publicidade ou subscrição.

## Estado desta versão

A Fase 1 está implementada: dashboard, receitas/despesas com edição e eliminação, categorias e subcategorias, carteiras e transferências, armazenamento local, PWA e backup com recuperação. Inclui também orçamento mensal geral/por categoria, gráficos offline, pesquisa, filtros e CSV. Instalações novas começam com saldos a zero e sem movimentos fictícios.

As metas de poupança, despesas recorrentes e relatórios anuais com barras comparativas ficam para as fases seguintes. O dashboard já compara despesas mensais, mostra distribuição por categoria e evolução diária.

## Desenvolvimento

Requer Node.js 24 LTS e npm.

```sh
npm ci
npm run dev
```

Abrir `http://localhost:5173/meu-saldo/`. Para validar:

```sh
npm run check
npm audit --audit-level=moderate
```

Testes de ponta a ponta: `npm run build`, `npx playwright install chromium` e `npm run test:e2e`. Ver [documentação de testes](docs/TESTING.md).

Para experimentar a PWA e o cache offline, usar o build de produção:

```sh
npm run build
npm run preview
```

Abrir `http://localhost:4173/meu-saldo/`. O Service Worker está desactivado em desenvolvimento. Em produção é necessário HTTPS; localhost é permitido para testes. Os caminhos relativos e o manifest estão configurados para `/meu-saldo/`. A navegação usa fragmentos (`#movements`), sem rewrites de servidor.

## Instalar no iPhone

Depois de a publicação estar concluída, abrir no Safari:

**https://domingossarama.github.io/meu-saldo/**

1. Tocar em **Partilhar → Adicionar ao ecrã principal**.
2. Abrir a aplicação instalada com internet e verificar em Definições a confirmação de recursos offline.
3. Registar uma receita ou definir o saldo inicial de uma carteira.
4. Em Definições, exportar um backup JSON e guardá-lo em Ficheiros/iCloud Drive.

A instalação no dispositivo exige estes passos manuais. O Safari e a aplicação instalada podem ter espaços de armazenamento distintos. Para transportar dados, exportar e importar um backup.

## Os teus dados

O histórico fica apenas no IndexedDB deste navegador/origem. Não existe sincronização bancária nem recuperação numa conta online. Os recursos da aplicação são guardados pelo Service Worker para abrir sem internet depois do primeiro carregamento completo.

**Os dados locais podem ser apagados pelo utilizador ou pelo sistema.** O pedido de armazenamento persistente em Definições depende do navegador e não substitui backups. Os backups JSON e CSV não são encriptados: guardar num local privado e nunca no repositório público.

## Documentação

- [Arquitectura e integridade](docs/ARCHITECTURE.md)
- [Funcionalidades e utilização](docs/FEATURES.md)
- [Publicação no GitHub Pages](docs/DEPLOYMENT.md)
- [Qualidade, segurança e testes](docs/TESTING.md)
- [Regras para manutenção](AGENTS.md)

## Estrutura

```text
src/
  components/   formulários, modal, gráficos e elementos partilhados
  pages/        dashboard, movimentos, carteiras, categorias, orçamentos, definições
  hooks/        estado de rede e actualizações PWA
  services/     operações financeiras, backup e CSV
  database/     esquema Dexie e dados iniciais não financeiros
  models/       modelos TypeScript e validadores Zod
  utils/        dinheiro e datas
  styles/       tema e layout responsivo
  assets/       convenções dos recursos visuais
  tests/        testes de dados e componentes
public/         ícones locais PWA/iOS
```
