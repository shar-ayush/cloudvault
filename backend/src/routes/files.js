// backend/src/routes/files.js
// All file-related API routes — protected by Cognito JWT middleware

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  upload,
  uploadFileHandler,
  listFilesHandler,
  downloadFileHandler,
  deleteFileHandler,
} = require('../controllers/fileController');
const {
  listVersionsHandler,
  restoreVersionHandler,
} = require('../controllers/versionController');

// Apply JWT verification to ALL routes in this router
router.use(verifyToken);

// File CRUD operations
router.post('/upload', upload.single('file'), uploadFileHandler);
router.get('/list', listFilesHandler);
router.get('/download/:fileName', downloadFileHandler);
router.delete('/delete/:fileName', deleteFileHandler);

// Version operations
router.get('/versions/:fileName', listVersionsHandler);
router.post('/restore/:fileName/:versionId', restoreVersionHandler);

module.exports = router;
