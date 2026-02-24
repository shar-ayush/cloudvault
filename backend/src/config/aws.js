// backend/src/config/aws.js
// AWS SDK configuration — uses IAM role on EC2, no hardcoded credentials

const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';

AWS.config.update({ region });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports = { s3, dynamoDB, AWS };
