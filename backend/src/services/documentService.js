const documentRepository = require('../repositories/documentRepository');

class NotFoundError extends Error {
  status = 404;
}

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
function getDocumentForDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new NotFoundError('Documento não encontrado');
  }
  return { document, filePath: documentRepository.getFilePath(id) };
}

module.exports = { NotFoundError, registerDocument, listDocuments, getDocumentForDownload };
