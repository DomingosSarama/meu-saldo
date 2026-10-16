# Publicação no GitHub Pages

Destino único: **https://domingossarama.github.io/meu-saldo/**.

## Antes de publicar

1. Rever o Pull Request e os resultados do workflow **Verificar MeuSaldo**.
2. No GitHub do repositório, abrir **Settings → Pages → Build and deployment → Source → GitHub Actions**. Confirmar que Pages está disponível no plano pessoal gratuito e HTTPS activo.
3. Fazer merge apenas depois da aprovação do proprietário. Esta implementação não faz merge automaticamente.

O workflow `pages.yml` verifica lint, testes, TypeScript, build e auditoria, carrega o artefacto estático e publica. Só publica `main`, incluindo execuções manuais. Pull Requests executam apenas CI e não publicam. Não adicionar backups nem dados pessoais aos artefactos ou ao repositório.

## Caminhos e manutenção

O `base` Vite e o manifest usam `/meu-saldo/`. As rotas usam fragmentos de URL. Se o nome do repositório mudar, é necessário actualizar base, manifest (ID, scope, start URL) e fallback Workbox juntos. Trocar de domínio/origem não transporta IndexedDB: exportar um backup antes.

Para publicar uma alteração depois de aprovada, o push em `main` desencadeia o workflow. Não precisa de servidor pago, segredo bancário nem token personalizado de publicação; usa `GITHUB_TOKEN` do próprio Actions e OIDC com permissões mínimas.

## Verificar a primeira publicação

- Verificar que o job `deploy` terminou com sucesso e abrir o URL indicado acima.
- Manifest e ícones devem responder em `/meu-saldo/`.
- Abrir com rede, aguardar a preparação offline e fechar/reabrir em modo avião.
- Testar registo, fecho/reabertura, backup e restauração no iPhone.
- Instalar através do Safari, abrir a instalação e repetir o teste offline.
- Criar um backup antes de testar actualizações, limpeza de armazenamento ou mudança de origem.

O ambiente desta entrega pode preparar e testar o build local sem provar que Pages está configurado na conta. A publicação só deve ser anunciada como concluída após o workflow de deployment ter sucesso.
