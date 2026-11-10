const documentRepository = require('../repositories/documentRepository');
const { NotFoundError } = require('./errors');

function registerDocument({ id, originalName, size, owner }) {
  return documentRepository.save({
    id,
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
  });
}

function listDocuments(owner) {
  return documentRepository.findAllByOwner(owner);
}

// Documento de outro usuário é tratado como inexistente.
function findOwnedDocument(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new NotFoundError('Documento não encontrado');
  }
  return document;
}

function getDocumentForDownload(id, owner) {
  const document = findOwnedDocument(id, owner);
  return { document, filePath: documentRepository.getFilePath(id) };
}

module.exports = { registerDocument, listDocuments, getDocumentForDownload };
