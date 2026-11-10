const path = require('path');

const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(__dirname, '../../storage');

// Metadados em memória nesta fase; os arquivos ficam em STORAGE_DIR.
const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findAllByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function findById(id) {
  return documents.get(id) || null;
}

function getFilePath(id) {
  return path.join(STORAGE_DIR, id);
}

module.exports = { STORAGE_DIR, save, findAllByOwner, findById, getFilePath };
