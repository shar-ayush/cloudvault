// backend/ecosystem.config.js
// PM2 process manager configuration

module.exports = {
  apps: [
    {
      name: 'cloudvault-api',
      script: 'src/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
