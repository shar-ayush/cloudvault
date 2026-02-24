// frontend/src/aws-exports.js
// AWS Amplify configuration — reads from environment variables

const awsExports = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
    },
  },
};

export default awsExports;
