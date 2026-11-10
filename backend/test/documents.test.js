const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// O storage e o limite são lidos na importação, então precisam vir antes do require.
const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_FILE_SIZE_MB = '1';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(storageDir, { recursive: true, force: true });
});

// Cada teste usa um dono único porque os metadados ficam em memória.
let ownerCounter = 0;
const newOwner = () => `owner-${++ownerCounter}`;

function uploadFile(owner, { name = 'relatorio.txt', content = 'conteudo de teste' } = {}) {
  const form = new FormData();
  form.append('file', new Blob([content]), name);
  const headers = owner ? { 'x-user-id': owner } : {};
  return fetch(`${baseUrl}/upload`, { method: 'POST', headers, body: form });
}

test('POST /upload grava o arquivo no storage e retorna os metadados', async () => {
  const owner = newOwner();

  const response = await uploadFile(owner);
  const document = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.size, Buffer.byteLength('conteudo de teste'));
  assert.strictEqual(document.owner, owner);
  assert.ok(fs.existsSync(path.join(storageDir, document.id)));
});

test('POST /upload sem x-user-id retorna 400', async () => {
  const response = await uploadFile(null);

  assert.strictEqual(response.status, 400);
});

test('POST /upload sem arquivo retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'x-user-id': newOwner() },
    body: new FormData(),
  });

  assert.strictEqual(response.status, 400);
});

test('POST /upload acima do limite retorna 413', async () => {
  const response = await uploadFile(newOwner(), { content: 'x'.repeat(2 * 1024 * 1024) });

  assert.strictEqual(response.status, 413);
});

test('GET /documents lista apenas os documentos do usuário', async () => {
  const alice = newOwner();
  const bob = newOwner();
  const { id } = await (await uploadFile(alice)).json();

  const aliceList = await (await fetch(`${baseUrl}/documents`, { headers: { 'x-user-id': alice } })).json();
  const bobList = await (await fetch(`${baseUrl}/documents`, { headers: { 'x-user-id': bob } })).json();

  assert.deepStrictEqual(aliceList.map((document) => document.id), [id]);
  assert.deepStrictEqual(bobList, []);
});

test('GET /documents sem x-user-id retorna 400', async () => {
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 400);
});

test('GET /documents/:id/download devolve o conteúdo e o nome originais', async () => {
  const owner = newOwner();
  const { id } = await (await uploadFile(owner, { name: 'ata.txt', content: 'ata da reuniao' })).json();

  const response = await fetch(`${baseUrl}/documents/${id}/download`, { headers: { 'x-user-id': owner } });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(await response.text(), 'ata da reuniao');
  assert.match(response.headers.get('content-disposition'), /ata\.txt/);
});

test('GET /documents/:id/download de outro usuário retorna 404', async () => {
  const { id } = await (await uploadFile(newOwner())).json();

  const response = await fetch(`${baseUrl}/documents/${id}/download`, { headers: { 'x-user-id': newOwner() } });

  assert.strictEqual(response.status, 404);
});

test('GET /documents/:id/download com id inexistente retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/inexistente/download`, { headers: { 'x-user-id': newOwner() } });

  assert.strictEqual(response.status, 404);
});
