# US-005 - Cores de status e prioridade

Prioridade: P3
Complexidade: P
Dependencias bloqueantes: nenhuma
Dependencias nao bloqueantes: nenhuma
Fonte: `docs/design/TOKENS.md`

## Historia de usuario

Como usuario recorrente, quero identificar prioridades por cor para fazer leitura
rapida do quadro durante o planejamento.

## Contexto

Sinais visuais consistentes reduzem o tempo de triagem e ajudam a separar
urgencia, prioridade de sprint e itens futuros.

## Criterios de aceite

- [x] P0 usa vermelho.
- [x] P1 usa amarelo.
- [x] P2 usa verde.
- [x] Estados neutros usam cinza.

## Definition of Done

- [x] Badges de prioridade implementados.
- [x] Tokens visuais aplicados no card e no painel.
- [x] Fallback neutro definido para prioridade desconhecida.

## Casos de teste

- [x] Card P0 renderiza badge de perigo.
- [x] Card P1 renderiza badge de alerta.
- [x] Card P2 renderiza badge de sucesso.
- [x] Card sem prioridade valida renderiza fallback.

## Orientacoes tecnicas

- Centralizar variacoes visuais no componente `Badge`.
