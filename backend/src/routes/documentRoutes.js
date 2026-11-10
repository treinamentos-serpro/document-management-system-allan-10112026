const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const documentController = require('../controllers/documentController');
const { STORAGE_DIR } = require('../repositories/documentRepository');

const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 10;

// O nome em disco é o id gerado, nunca o nome enviado pelo cliente.
const storage = multer.diskStorage({
  destination: STORAGE_DIR,
  filename: (req, file, cb) => cb(null, crypto.randomUUID()),
});

const upload = multer({ storage, limits: { fileSize: maxFileSizeMb * 1024 * 1024 } });

const router = express.Router();

router.post('/upload', documentController.requireOwner, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireOwner, documentController.list);
router.get('/documents/:id/download', documentController.requireOwner, documentController.download);

module.exports = router;
