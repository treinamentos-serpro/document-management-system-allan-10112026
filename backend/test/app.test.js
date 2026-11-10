const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

const storageDirectory = path.join(__dirname, '../storage');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  t.after(async () => {
    const files = await fs.readdir(storageDirectory);
    await Promise.all(
      files
        .filter((file) => file !== '.gitkeep')
        .map((file) => fs.unlink(path.join(storageDirectory, file))),
    );
  });

  const baseUrl = `http://localhost:${server.address().port}`;
  const form = new FormData();
  form.append('file', new Blob(['conteúdo do documento']), 'documento.txt');
  form.append('owner', 'usuario-teste');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const uploadedDocument = await uploadResponse.json();
  assert.strictEqual(uploadedDocument.originalName, 'documento.txt');
  assert.strictEqual(
    uploadedDocument.size,
    Buffer.byteLength('conteúdo do documento'),
  );
  assert.strictEqual(uploadedDocument.owner, 'usuario-teste');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual(await listResponse.json(), [uploadedDocument]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
  );
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'conteúdo do documento');
  assert.match(
    downloadResponse.headers.get('content-disposition'),
    /filename="documento\.txt"/,
  );
});

test('download de documento inexistente retorna 404', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const response = await fetch(
    `http://localhost:${server.address().port}/documents/inexistente/download`,
  );
  assert.strictEqual(response.status, 404);
  assert.deepStrictEqual(await response.json(), {
    error: 'Documento não encontrado',
  });
});
