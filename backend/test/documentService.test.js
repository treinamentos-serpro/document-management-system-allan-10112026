const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert');
const documentRepository = require('../src/repositories/documentRepository');
const documentService = require('../src/services/documentService');
const { NotFoundError } = require('../src/services/errors');

afterEach(() => mock.restoreAll());

const storedDocument = { id: 'doc-1', originalName: 'a.txt', size: 3, owner: 'alice' };

test('registerDocument salva os metadados com data de upload em ISO 8601', () => {
  const save = mock.method(documentRepository, 'save', (document) => document);

  const result = documentService.registerDocument(storedDocument);

  assert.strictEqual(save.mock.callCount(), 1);
  assert.strictEqual(result.id, 'doc-1');
  assert.strictEqual(result.owner, 'alice');
  assert.strictEqual(new Date(result.uploadedAt).toISOString(), result.uploadedAt);
});

test('listDocuments consulta o repositório pelo dono informado', () => {
  const findAllByOwner = mock.method(documentRepository, 'findAllByOwner', () => [storedDocument]);

  const result = documentService.listDocuments('alice');

  assert.deepStrictEqual(findAllByOwner.mock.calls[0].arguments, ['alice']);
  assert.deepStrictEqual(result, [storedDocument]);
});

test('getDocumentForDownload retorna o documento e o caminho do arquivo para o dono', () => {
  mock.method(documentRepository, 'findById', () => storedDocument);
  mock.method(documentRepository, 'getFilePath', (id) => `/storage/${id}`);

  const result = documentService.getDocumentForDownload('doc-1', 'alice');

  assert.deepStrictEqual(result, { document: storedDocument, filePath: '/storage/doc-1' });
});

test('getDocumentForDownload lança NotFoundError quando o documento não existe', () => {
  mock.method(documentRepository, 'findById', () => null);

  assert.throws(() => documentService.getDocumentForDownload('x', 'alice'), NotFoundError);
});

test('getDocumentForDownload lança NotFoundError quando o documento é de outro usuário', () => {
  mock.method(documentRepository, 'findById', () => storedDocument);

  assert.throws(() => documentService.getDocumentForDownload('doc-1', 'bob'), NotFoundError);
});
