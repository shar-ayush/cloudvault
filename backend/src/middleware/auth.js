// backend/src/middleware/auth.js
// Cognito JWT verification middleware using JWKS endpoint

const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const dotenv = require('dotenv');

dotenv.config();

const REGION = process.env.AWS_REGION || 'us-east-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

if (!USER_POOL_ID) {
  console.warn('WARNING: COGNITO_USER_POOL_ID is not set in environment variables');
}

const JWKS_URI = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

const verifyToken = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: JWKS_URI,
  }),
  issuer: ISSUER,
  algorithms: ['RS256'],
  requestProperty: 'auth', // decoded token available at req.auth
});

module.exports = { verifyToken };
