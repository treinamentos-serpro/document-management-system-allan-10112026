const express = require('express');
const { rateLimit } = require('express-rate-limit');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3000;
const storageDirectory = path.join(__dirname, '../storage');
const documents = new Map();
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => callback(null, randomUUID()),
  }),
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const document = {
    id: randomUUID(),
    originalName: req.file.originalname,
    size: req.file.size,
    uploadDate: new Date().toISOString(),
    owner: req.body.owner || null,
    filename: req.file.filename,
  };
  documents.set(document.id, document);

  const { filename, ...metadata } = document;
  return res.status(201).json(metadata);
});

app.get('/documents', (req, res) => {
  res.json(
    Array.from(documents.values(), ({ filename, ...metadata }) => metadata),
  );
});

app.get('/documents/:id/download', downloadLimiter, (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }

  if (!/^[\da-f-]{36}$/i.test(document.filename)) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }

  return res.download(
    path.join(storageDirectory, path.basename(document.filename)),
    document.originalName,
  );
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
