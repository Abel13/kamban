# US-003 - Suporte a metadados no Markdown

Prioridade: P1
Complexidade: G
Dependencias bloqueantes: nenhuma
Dependencias nao bloqueantes: US-001, US-002
Fonte: `docs/arquitetura/MARKDOWN.md`

## Historia de usuario

Como dev, quero que o parser aceite campos textuais simples para extrair titulo,
prioridade, complexidade, dependencias e fontes sem exigir um banco de dados.

## Contexto

O kanban local depende de arquivos Markdown versionaveis. O parser precisa ser
tolerante a campos ausentes e preservar leitura fora do app.

## Criterios de aceite

- [ ] O titulo e extraido do primeiro H1.
- [ ] A US e extraida do padrao `US-000`.
- [ ] Prioridade, complexidade e dependencias sao extraidas do cabecalho.
- [ ] Campos desconhecidos nao quebram a leitura.
- [ ] Arquivos continuam legiveis fora do app.

## Definition of Done

- [ ] Parser atualizado para o padrao novo.
- [ ] Tipos de dominio refletem dependencias bloqueantes e nao bloqueantes.
- [ ] Testes cobrem dependencias e defaults seguros.

## Casos de teste

- [ ] Card com dependencias separadas por virgula retorna arrays normalizados.
- [ ] Card com `nenhuma` retorna lista vazia.
- [ ] Complexidade invalida retorna `N/A`.

## Orientacoes tecnicas

- Manter `gray-matter` para suportar frontmatter sem tratar texto manualmente.
- Aceitar `Dependencias nao bloqueantes` e `Dependencias não bloqueantes`.
