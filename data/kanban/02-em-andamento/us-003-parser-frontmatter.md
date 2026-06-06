# US-003 - Suporte a metadados no Markdown

Prioridade: P1
Complexidade: L
Fonte: `docs/arquitetura/MARKDOWN.md`

## Historia de usuario

Como dev, quero que o parser aceite campos textuais simples para extrair titulo,
prioridade, complexidade e fontes sem exigir um banco de dados.

## Criterios de aceite

- O titulo e extraido do primeiro H1.
- A US e extraida do padrao `US-000`.
- Campos desconhecidos nao quebram a leitura.
- Arquivos continuam legiveis fora do app.
