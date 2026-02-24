// backend/src/controllers/versionController.js
// Handles file version listing and version restoration

const { dynamoDB } = require('../config/aws');
const s3Helper = require('../utils/s3Helper');
const dotenv = require('dotenv');

dotenv.config();

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'FileMetadata';

/**
 * GET /api/files/versions/:fileName
 * Return all versions of a file, labeled V1, V2, V3…
 */
async function listVersionsHandler(req, res, next) {
  try {
    const userId = req.auth.sub;
    const { fileName } = req.params;

    if (!fileName) {
      const err = new Error('fileName parameter is required');
      err.name = 'ValidationError';
      throw err;
    }

    const versions = await s3Helper.listVersions(userId, fileName);

    return res.status(200).json({
      message: 'Versions retrieved successfully',
      fileName,
      count: versions.length,
      versions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/files/restore/:fileName/:versionId
 * Restore a previous version — copies old version as new current.
 * Updates DynamoDB with the new versionId.
 */
async function restoreVersionHandler(req, res, next) {
  try {
    const userId = req.auth.sub;
    const { fileName, versionId } = req.params;

    if (!fileName || !versionId) {
      const err = new Error('fileName and versionId parameters are required');
      err.name = 'ValidationError';
      throw err;
    }

    // Restore the version in S3 (copy old version as new latest)
    const result = await s3Helper.restoreVersion(userId, fileName, versionId);

    // Update DynamoDB metadata with new version ID (non-blocking)
    try {
      await dynamoDB
        .update({
          TableName: DYNAMODB_TABLE,
          Key: { userId, fileKey: `${userId}/${fileName}` },
          UpdateExpression: 'SET currentVersionId = :vid, uploadedAt = :ts',
          ExpressionAttributeValues: {
            ':vid': result.newVersionId || 'N/A',
            ':ts': new Date().toISOString(),
          },
        })
        .promise();
      console.log(`[DynamoDB] Version updated for ${userId}/${fileName}`);
    } catch (dbErr) {
      console.error(`[DynamoDB] Failed to update version metadata: ${dbErr.message}`);
    }

    return res.status(200).json({
      message: 'Version restored successfully',
      fileName,
      restoredFromVersionId: versionId,
      newVersionId: result.newVersionId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listVersionsHandler,
  restoreVersionHandler,
};
