# Especificação - Document Management System

## 1. Objetivo

Entregar um sistema web para enviar, listar e baixar documentos por usuário, com os arquivos gravados no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (dono identificado por cabeçalho, sem autenticação)

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação real
- Exclusão de documentos
- Persistência dos metadados além da memória

## 3. Requisitos funcionais

| ID    | Requisito                                                                    |
| ----- | ---------------------------------------------------------------------------- |
| RF-01 | O usuário envia um documento via `multipart/form-data` (campo `file`)        |
| RF-02 | O usuário lista os documentos que enviou                                     |
| RF-03 | O usuário baixa um documento pelo identificador, com o nome original         |
| RF-04 | Cada documento é associado ao usuário informado em `x-user-id`               |
| RF-05 | Um usuário não lista nem baixa documentos de outro usuário                   |
| RF-06 | O frontend oferece formulário de upload, lista de documentos e ação de download |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados em `backend/storage` via `multer` com `diskStorage`                              |
| RNF-02 | Metadados mantidos em memória nesta fase                                                           |
| RNF-03 | Configuração via variáveis de ambiente: `PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE_MB` (padrão 10)      |
| RNF-04 | Arquivo gravado com o `id` como nome, sem usar o nome enviado pelo cliente (evita path traversal)  |
| RNF-05 | Erros tratados nos limites do sistema (HTTP e filesystem), com mensagens em português              |
| RNF-06 | Backend em JavaScript puro (CommonJS), testes com `node:test`                                      |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                              |
| ------------ | ------ | -------------------------------------- |
| id           | string | UUID gerado por `crypto.randomUUID()`  |
| originalName | string | Nome original do arquivo enviado       |
| size         | number | Tamanho em bytes                       |
| uploadedAt   | string | Data/hora do upload (ISO 8601)         |
| owner        | string | Valor do cabeçalho `x-user-id`         |

O caminho físico é derivado de `STORAGE_DIR` + `id` e não é exposto na API.

## 6. Contratos de API

Todas as rotas de documentos exigem o cabeçalho `x-user-id`. No frontend, elas são acessadas com o prefixo `/api`.

| Endpoint                      | Entrada                             | Sucesso                                                        | Erros                                                              |
| ----------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `POST /upload`                | `multipart/form-data`, campo `file` | `201` com os metadados                                         | `400` sem arquivo ou sem `x-user-id`; `413` acima do limite        |
| `GET /documents`              | -                                   | `200` com lista de metadados do usuário                        | `400` sem `x-user-id`                                              |
| `GET /documents/:id/download` | -                                   | `200` com binário e `Content-Disposition` com o nome original  | `400` sem `x-user-id`; `404` inexistente ou de outro usuário       |
| `GET /health`                 | -                                   | `200` `{ "status": "ok" }` (já existe)                         | -                                                                  |

Erros retornam JSON no formato `{ "error": "mensagem em português" }`.

## 7. Decisões arquiteturais

- Clean Architecture simples em `backend/src`, com fluxo `routes -> controllers -> services -> repositories`.
- `routes/` registra os endpoints e delega; `controllers/` valida a entrada HTTP; `services/` aplica as regras de negócio (dono, geração de `id`); `repositories/` cuida dos metadados em memória e do acesso ao arquivo em disco.
- `multer` com `diskStorage` fica na borda HTTP, e o limite de tamanho vem do ambiente.
- Frontend com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`. As chamadas usam `fetch` com o prefixo `/api`, conforme o proxy do Vite.
- Dependências: apenas `express` e `multer`, que já existem no `package.json`.

## 8. Plano de execução

Etapas a serem implementadas posteriormente; este documento não inclui a implementação.

1. **Fase A - Fundação do backend:** ler configuração do ambiente e criar o repositório de metadados em memória e o acesso a `backend/storage`.
2. **Fase B - Regras de negócio:** criar o serviço de documentos (registrar, listar por dono, buscar por id e dono). Depende da Fase A.
3. **Fase C - HTTP:** criar o middleware do `multer`, os controllers, as rotas e o tratamento de erros, e registrar tudo em `app.js`. Depende da Fase B.
4. **Fase D - Testes do backend:** cobrir upload, listagem, download, isolamento entre usuários e erros `400`, `404` e `413` em `backend/test`. Em paralelo com a Fase C, usando TDD.
5. **Fase E - Frontend:** criar o serviço `fetch`, o formulário de upload, a lista com download e a página principal. Depende do contrato da Fase C; pode começar em paralelo com mocks.
6. **Fase F - Integração:** validar o fluxo fim a fim com o backend na porta 3000 e o Vite na 5173.

## 9. Critérios de aceite

- Enviar um arquivo retorna `201`, e o arquivo existe em `backend/storage`.
- A listagem mostra apenas os documentos do `x-user-id` informado.
- O download devolve o conteúdo idêntico ao enviado, com o nome original.
- O usuário B recebe `404` ao tentar baixar o documento do usuário A.
- `npm test` no backend passa.
