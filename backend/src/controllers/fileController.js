// backend/src/controllers/fileController.js
// Handles file upload, list, download, and delete operations

const multer = require('multer');
const { dynamoDB } = require('../config/aws');
const s3Helper = require('../utils/s3Helper');
const dotenv = require('dotenv');

dotenv.config();

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'FileMetadata';

// Multer setup — memory storage, 50 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/**
 * POST /api/files/upload
 * Upload a file to S3 and save metadata to DynamoDB.
 */
async function uploadFileHandler(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No file provided in request');
      err.name = 'ValidationError';
      throw err;
    }

    const userId = req.auth.sub; // from Cognito JWT
    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    // Upload to S3
    const s3Result = await s3Helper.uploadFile(userId, fileName, fileBuffer, mimeType);

    // Save metadata to DynamoDB (non-blocking — don't let DynamoDB failure block response)
    try {
      const params = {
        TableName: DYNAMODB_TABLE,
        Item: {
          userId,
          fileKey: `${userId}/${fileName}`,
          fileName,
          uploadedAt: new Date().toISOString(),
          currentVersionId: s3Result.VersionId || 'N/A',
          fileSize,
          mimeType,
        },
      };
      await dynamoDB.put(params).promise();
      console.log(`[DynamoDB] Metadata saved for ${userId}/${fileName}`);
    } catch (dbErr) {
      console.error(`[DynamoDB] Failed to save metadata: ${dbErr.message}`);
      // Don't throw — S3 upload was successful
    }

    return res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        name: fileName,
        size: fileSize,
        mimeType,
        versionId: s3Result.VersionId,
        location: s3Result.Location,
        key: s3Result.Key,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/files/list
 * List all files for the authenticated user.
 */
async function listFilesHandler(req, res, next) {
  try {
    const userId = req.auth.sub;

    // Get files from S3
    const s3Files = await s3Helper.listFiles(userId);

    // Attempt to enrich with DynamoDB metadata
    let enrichedFiles = s3Files;
    try {
      const enriched = await Promise.all(
        s3Files.map(async (file) => {
          try {
            const dbResult = await dynamoDB
              .get({
                TableName: DYNAMODB_TABLE,
                Key: { userId, fileKey: `${userId}/${file.name}` },
              })
              .promise();

            if (dbResult.Item) {
              return {
                ...file,
                mimeType: dbResult.Item.mimeType || 'application/octet-stream',
                currentVersionId: dbResult.Item.currentVersionId || null,
                uploadedAt: dbResult.Item.uploadedAt || file.lastModified,
              };
            }
            return file;
          } catch {
            return file; // Fallback to S3 data if DynamoDB query fails
          }
        })
      );
      enrichedFiles = enriched;
    } catch (dbErr) {
      console.error(`[DynamoDB] Enrichment failed: ${dbErr.message}`);
    }

    return res.status(200).json({
      message: 'Files retrieved successfully',
      count: enrichedFiles.length,
      files: enrichedFiles,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/files/download/:fileName?versionId=...
 * Return a pre-signed download URL.
 */
async function downloadFileHandler(req, res, next) {
  try {
    const userId = req.auth.sub;
    const { fileName } = req.params;
    const { versionId } = req.query;

    if (!fileName) {
      const err = new Error('fileName parameter is required');
      err.name = 'ValidationError';
      throw err;
    }

    const url = await s3Helper.getSignedDownloadUrl(userId, fileName, versionId || null);

    return res.status(200).json({
      message: 'Download URL generated',
      url,
      fileName,
      versionId: versionId || 'latest',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/files/delete/:fileName
 * Delete a file from S3 and remove metadata from DynamoDB.
 */
async function deleteFileHandler(req, res, next) {
  try {
    const userId = req.auth.sub;
    const { fileName } = req.params;

    if (!fileName) {
      const err = new Error('fileName parameter is required');
      err.name = 'ValidationError';
      throw err;
    }

    // Delete from S3
    await s3Helper.deleteFile(userId, fileName);

    // Delete metadata from DynamoDB (non-blocking)
    try {
      await dynamoDB
        .delete({
          TableName: DYNAMODB_TABLE,
          Key: { userId, fileKey: `${userId}/${fileName}` },
        })
        .promise();
      console.log(`[DynamoDB] Metadata deleted for ${userId}/${fileName}`);
    } catch (dbErr) {
      console.error(`[DynamoDB] Failed to delete metadata: ${dbErr.message}`);
    }

    return res.status(200).json({
      message: 'File deleted successfully',
      fileName,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  uploadFileHandler,
  listFilesHandler,
  downloadFileHandler,
  deleteFileHandler,
};
