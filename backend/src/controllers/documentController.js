const documentService = require('../services/documentService');

function requireOwner(req, res, next) {
  const owner = req.get('x-user-id');
  if (!owner || !owner.trim()) {
    return res.status(400).json({ error: 'Cabeçalho x-user-id é obrigatório' });
  }
  req.owner = owner.trim();
  next();
}

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo é obrigatório (campo "file")' });
  }
  const document = documentService.registerDocument({
    id: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    owner: req.owner,
  });
  res.status(201).json(document);
}

function list(req, res) {
  res.json(documentService.listDocuments(req.owner));
}

function download(req, res, next) {
  try {
    const { document, filePath } = documentService.getDocumentForDownload(req.params.id, req.owner);
    res.download(filePath, document.originalName, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { requireOwner, upload, list, download };
