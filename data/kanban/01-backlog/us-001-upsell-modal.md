# US-001 - Modal de upsell ao criar o 2o album

Prioridade: P0
Complexidade: M
Fonte: `docs/produto/UPSELL_PRO.md`, `docs/produto/MONETIZACAO.md`

## Historia de usuario

Como criador no plano Free, quero entender por que nao consigo criar outro album
ativo e qual beneficio o Pro libera, para decidir se devo assinar ou gerenciar
meus albuns atuais.

## Contexto

Hoje o backend bloqueia o 2o album ativo no Free e o front mostra um toast com
CTA para Pro. O momento e bom, mas a comunicacao e fraca para uma decisao de
compra.

## Criterios de aceite

- Quando um usuario Free tenta criar outro album ativo, a interface mostra um
  modal contextual em vez de depender apenas de toast.
- O modal informa o limite Free de 1 album ativo e o limite Pro de 10 albuns
  ativos.
- O modal tem CTAs para assinar Pro, ver meus albuns e cancelar.
- O usuario consegue fechar o modal sem perder contexto.
- O fluxo continua respeitando o bloqueio do backend.
- O evento de prompt visto/clicado/dispensado e registrado quando a
  instrumentacao estiver disponivel.

## Definition of Done

- Modal implementado no fluxo de criacao de album.
- Copy revisada e alinhada ao plano Pro vigente.
- Navegacao para pricing e meus albuns funcionando.
- Estado de loading/erro tratado sem duplicar prompts.
- Testes automatizados ou manuais documentados.

## Casos de teste

- Usuario Free com 0 albuns cria o primeiro album sem ver modal.
- Usuario Free com 1 album ativo tenta criar outro e ve modal.
- CTA "Assinar Pro" leva para `/pricing`.
- CTA "Ver meus albuns" leva para `/my-albums`.
- Usuario Pro cria novo album sem ver modal de limite Free.
- Erro inesperado de criacao ainda mostra mensagem generica adequada.

## Orientacoes tecnicas

- O backend ja retorna erro em `src/app/api/albums/route.ts` para
  `active_albums`.
- O front chama `createAlbum` em `src/views/CreateAlbumPage.tsx`.
- Evitar depender de string solta se possivel; preferir codigo/metadado de erro
  quando a API evoluir.
