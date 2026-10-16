# Funcionalidades e utilização

## Dashboard

Mostra saldo total das carteiras (todo o histórico), receitas/despesas do mês seleccionado, comparação de despesas com o mês anterior, orçamento geral, últimos movimentos de todo o histórico, distribuição por categoria e evolução diária do mês. O selector permite mudar de mês. O botão do olho oculta valores em todas as páginas e esconde gráficos quantitativos; a preferência fica guardada. A ocultação é visual, não é encriptação.

Sem despesas, os gráficos apresentam estados vazios. A comparação percentual só é mostrada quando o mês anterior tem despesas.

## Movimentos

- Criar receitas, despesas e transferências; data/hora actual preenchida automaticamente e editável.
- Valor positivo em MT com até duas casas decimais; descrição, método e observações opcionais.
- Categoria, subcategoria opcional e carteira. A transferência exige origem e destino distintos.
- Tocar num movimento para editar. Cada linha no dashboard e no histórico tem um botão **Eliminar**, com ícone de lixo e texto. A eliminação identifica o registo e exige confirmação; cancelar preserva-o. O botão continua disponível no formulário de edição. Eliminar receitas, despesas ou transferências recalcula os saldos, incluindo as duas carteiras de uma transferência.
- Pesquisar descrição, notas, categoria e subcategoria. Filtrar por carteira (incluindo transferências recebidas), tipo e categoria.
- Períodos: hoje, semana até hoje (segunda-feira como início), mês até hoje, mês anterior, ano até hoje, todo o histórico e datas personalizadas inclusivas.
- Ordenar por data crescente/decrescente ou por montante.

Receitas e despesas agendadas numa data futura entram nos saldos totais e no mês dessa data. Esta versão não tem agendamento ou distinção entre movimentos previstos e liquidados: registar apenas movimentos que se pretende contabilizar.

## Carteiras

As quatro carteiras iniciais são Dinheiro físico, M-Pesa, e-Mola e Conta bancária. É possível criar carteiras e editar nome/saldo inicial. O saldo inicial não conta como receita. Usar uma receita para dinheiro recebido depois do início do histórico.

Cada carteira mostra saldo, receitas/despesas totais e acesso ao histórico filtrado, incluindo transferências. O botão Transferir usa o mesmo formulário de movimentos. Não existe integração bancária nem pedido de credenciais financeiras. Remoção de carteiras não faz parte desta versão, para preservar o histórico.

## Categorias

Inclui todas as 14 categorias de despesa e 7 de receita pedidas. Transporte, Alimentação e Namorada têm subcategorias iniciais. Criar ou editar permite nome, tipo (fixo ao editar), ícone, cor e subcategorias separadas por vírgulas.

Em **Outros** pode-se registar a despesa ocasional nessa categoria ou criar uma categoria personalizada no próprio formulário. Categoria e movimento são gravados juntos. Categorias personalizadas ficam disponíveis na base local e nos backups.

A remoção exige escolher outra categoria do mesmo tipo e confirmar em **Reclassificar e eliminar**. Os movimentos são preservados; as subcategorias removidas perdem apenas essa classificação específica. Limites de orçamento são reclassificados; se isso criar dois limites na mesma categoria/mês, a operação é recusada para o utilizador resolver o conflito em Orçamentos primeiro.

## Orçamentos e gráficos

Definir um limite geral mensal e limites por categoria. O mesmo mês/categoria tem apenas um limite; uma nova gravação actualiza o existente. Mostra utilizado, restante e percentagem, com aviso a partir de 90%. Ultrapassar o limite não bloqueia registos. Os limites por categoria e o geral são independentes, não somados.

Gráficos SVG locais: circular por categoria e evolução diária com tabela acessível. Esta versão não inclui gráficos anuais de barras nem relatórios PDF.

## Definições, backup e instalação

Tema claro/escuro, exportação JSON completa, restauração validada com pré-visualização, CSV do histórico, instruções Safari e pedido opcional de armazenamento persistente. No iPhone, guardar o JSON em Ficheiros ou iCloud Drive através do menu partilhar/download. Para recuperar, escolher esse ficheiro, verificar as contagens e confirmar a substituição.

A instalação PWA não transfere automaticamente dados de outra origem ou navegador. Usar um backup. Uma nova versão oferece um aviso de actualização; concluir o formulário em curso antes de confirmar.

## Próximas fases

- Metas financeiras sem duplicar dinheiro das carteiras.
- Despesas recorrentes com chave idempotente por vencimento.
- Relatórios comparativos anuais e gráfico de barras por mês.
- Paginação e mutações incrementais para históricos grandes.
- Verificação manual em iPhone/Safari real, VoiceOver e ciclo de actualizações entre versões publicadas.
