# US-004 - Painel lateral de detalhes

Prioridade: P1
Complexidade: M
Dependencias bloqueantes: US-003
Dependencias nao bloqueantes: nenhuma
Fonte: `docs/design/KANBAN.md`

## Historia de usuario

Como stakeholder, quero abrir a visualizacao completa de uma US em um painel
lateral para revisar contexto, criterios e detalhes operacionais sem perder o
quadro de vista.

## Contexto

O card resumido ajuda no planejamento, mas revisao e QA precisam enxergar os
metadados e secoes completas da historia.

## Criterios de aceite

- [ ] O painel mostra prioridade, complexidade, status, data e arquivo.
- [ ] O painel mostra dependencias bloqueantes e nao bloqueantes.
- [ ] Secoes da historia aparecem com hierarquia visual.
- [ ] Checklists Markdown aparecem como checkboxes somente leitura.
- [ ] O painel pode ser fechado sem alterar o card.

## Definition of Done

- [ ] Painel lateral conectado ao modelo de dominio atualizado.
- [ ] Estados de sincronizacao preservados.
- [ ] Layout validado com textos longos e listas.

## Casos de teste

- [ ] Abrir um card exibe todas as secoes da historia.
- [ ] Card sem dependencias mostra `nenhuma`.
- [ ] Card com bloqueios mostra as US relacionadas.

## Orientacoes tecnicas

- Evitar parser Markdown completo enquanto o formato suportado for limitado.
- Priorizar componentes locais em `components/ui`.
