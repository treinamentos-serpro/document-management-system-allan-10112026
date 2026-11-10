---
description: "Escreve testes unitários isolados com node:test para um módulo do backend, seguindo o padrão dos testes existentes. Use ao criar ou ampliar testes de services, controllers ou repositories."
name: testes-unitarios
argument-hint: "caminho do módulo (ex. backend/src/services/documentService.js)"
agent: agent
---

# Testes unitários do backend

Escreva testes unitários para `${input:modulo:caminho do módulo em backend/src}` e rode `npm test` em `backend` até passarem.

## Antes de escrever

- Leia o módulo alvo e [backend/test/app.test.js](../../backend/test/app.test.js) para seguir o padrão existente: `node:test` (`test`, `mock`), `node:assert` e nomes de teste em português.
- Respeite a camada do módulo: [instruções do projeto](../copilot-instructions.md).

## Regras

- Um arquivo por módulo em `backend/test/<nome>.test.js`, que o `node --test` já descobre.
- Teste uma unidade por vez e isole as camadas vizinhas:
  - service: substitua o repository com `mock.method(repository, '<função>')`;
  - controller: chame o handler com `req` e `res` falsos e verifique status e corpo;
  - repository: teste direto, sem mocks.
- Estruture cada teste em preparar, executar e verificar, com uma intenção por teste.
- Nomeie descrevendo o comportamento e a condição (ex. "retorna 404 quando o documento é de outro usuário").
- Cubra o caminho feliz, as entradas inválidas e os erros que o módulo trata.
- Restaure os mocks (`mock.restoreAll()` em `afterEach`) e não deixe estado vazar entre testes. O repository guarda dados em memória no módulo, então use `owner` e `id` únicos por teste.
- Sem rede e sem dependência de ordem. Se precisar de disco, use um diretório temporário (`os.tmpdir()`) e remova ao final.
- Não use `supertest` nem suba o servidor: isso seria teste de integração e as dependências do projeto não o incluem.

## Entrega

Informe o que foi coberto, o que ficou de fora e o resultado do `npm test`. Não altere o código de produção; se encontrar um bug, relate em vez de corrigir.
