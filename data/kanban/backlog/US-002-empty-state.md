# US-002 - Empty state para quadro sem cards

Prioridade: P2
Complexidade: P
Dependencias bloqueantes: nenhuma
Dependencias nao bloqueantes: US-004
Fonte: `docs/produto/KANBAN_LOCAL.md`

## Historia de usuario

Como product manager, quero ver um estado vazio claro quando uma coluna nao tem
cards para saber que posso criar ou mover historias para ela.

## Contexto

Colunas vazias precisam continuar funcionais como area de drop e informar que o
estado esta correto, nao quebrado.

## Criterios de aceite

- [ ] Colunas vazias mantem area de drop visivel.
- [ ] O texto e discreto e nao compete com cards existentes.
- [ ] A quantidade de cards segue visivel no cabecalho.

## Definition of Done

- [ ] Estado vazio renderizado para qualquer raia sem cards.
- [ ] Area de drop permanece ativa.
- [ ] Comportamento validado em desktop e mobile.

## Casos de teste

- [ ] Coluna sem cards mostra "Sem cards".
- [ ] Card pode ser arrastado para uma coluna vazia.
- [ ] Contador da coluna vazia mostra zero.

## Orientacoes tecnicas

- Reusar a estrutura atual de `KanbanColumn`.
- Evitar altura dinamica que reduza a area de drop.
