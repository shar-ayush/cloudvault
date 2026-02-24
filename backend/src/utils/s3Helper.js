// backend/src/utils/s3Helper.js
// S3 operations: upload, list, versions, download URL, delete, restore

const { s3 } = require('../config/aws');
const dotenv = require('dotenv');

dotenv.config();

const PRIMARY_BUCKET = process.env.S3_PRIMARY_BUCKET || 'cloudvault-primary';

/**
 * Upload a file to S3 with server-side encryption.
 * Key = userId/fileName  — namespaces files per user.
 */
async function uploadFile(userId, fileName, fileBuffer, mimeType) {
  const key = `${userId}/${fileName}`;
  const params = {
    Bucket: PRIMARY_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
  };

  try {
    const result = await s3.upload(params).promise();
    console.log(`[S3] Uploaded ${key} — VersionId: ${result.VersionId}`);
    return {
      VersionId: result.VersionId,
      Location: result.Location,
      Key: result.Key,
    };
  } catch (err) {
    console.error(`[S3] Upload failed for ${key}:`, err.message);
    throw err;
  }
}

/**
 * List all files (current versions) for a user.
 */
async function listFiles(userId) {
  const prefix = `${userId}/`;
  const params = {
    Bucket: PRIMARY_BUCKET,
    Prefix: prefix,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const files = (data.Contents || [])
      .filter((obj) => obj.Key !== prefix) // exclude the folder marker itself
      .map((obj) => ({
        name: obj.Key.replace(prefix, ''),
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
    return files;
  } catch (err) {
    console.error(`[S3] listFiles failed for ${userId}:`, err.message);
    throw err;
  }
}

/**
 * List all versions of a specific file for a user.
 * Returns versions labeled V1, V2, V3… (oldest first).
 */
async function listVersions(userId, fileName) {
  const key = `${userId}/${fileName}`;
  const params = {
    Bucket: PRIMARY_BUCKET,
    Prefix: key,
  };

  try {
    const data = await s3.listObjectVersions(params).promise();

    // Filter only exact key matches and exclude delete markers
    const versions = (data.Versions || [])
      .filter((v) => v.Key === key)
      .sort((a, b) => new Date(a.LastModified) - new Date(b.LastModified)) // oldest first
      .map((v, index) => ({
        label: `V${index + 1}`,
        versionId: v.VersionId,
        lastModified: v.LastModified,
        size: v.Size,
        isLatest: v.IsLatest,
      }));

    return versions;
  } catch (err) {
    console.error(`[S3] listVersions failed for ${key}:`, err.message);
    throw err;
  }
}

/**
 * Generate a pre-signed download URL (valid for 300 seconds).
 * Optionally target a specific version.
 */
async function getSignedDownloadUrl(userId, fileName, versionId = null) {
  const key = `${userId}/${fileName}`;
  const params = {
    Bucket: PRIMARY_BUCKET,
    Key: key,
    Expires: 300, // 5 minutes
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  };

  if (versionId) {
    params.VersionId = versionId;
  }

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    console.log(`[S3] Signed URL generated for ${key}`);
    return url;
  } catch (err) {
    console.error(`[S3] getSignedDownloadUrl failed for ${key}:`, err.message);
    throw err;
  }
}

/**
 * Delete a file from S3.
 */
async function deleteFile(userId, fileName) {
  const key = `${userId}/${fileName}`;
  const params = {
    Bucket: PRIMARY_BUCKET,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`[S3] Deleted ${key}`);
    return { deleted: true, key };
  } catch (err) {
    console.error(`[S3] deleteFile failed for ${key}:`, err.message);
    throw err;
  }
}

/**
 * Restore an older version by copying it as the new current version.
 * This creates a brand-new version (new VersionId) in the bucket.
 */
async function restoreVersion(userId, fileName, versionId) {
  const key = `${userId}/${fileName}`;
  const copySource = encodeURIComponent(`${PRIMARY_BUCKET}/${key}?versionId=${versionId}`);

  const params = {
    Bucket: PRIMARY_BUCKET,
    Key: key,
    CopySource: `${PRIMARY_BUCKET}/${key}`,
    CopySourceVersionId: versionId,
    ServerSideEncryption: 'AES256',
  };

  try {
    const result = await s3.copyObject(params).promise();
    const newVersionId = result.VersionId;
    console.log(`[S3] Restored ${key} from ${versionId} → new VersionId: ${newVersionId}`);
    return { newVersionId };
  } catch (err) {
    console.error(`[S3] restoreVersion failed for ${key}:`, err.message);
    throw err;
  }
}

module.exports = {
  uploadFile,
  listFiles,
  listVersions,
  getSignedDownloadUrl,
  deleteFile,
  restoreVersion,
};
