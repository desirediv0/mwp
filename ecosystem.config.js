module.exports = {
  apps: [
    {
      name: 'mwp-client',
      cwd: '/var/www/mwp/client',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      },
      error_file: "/home/mwp/.pm2/logs/mwp-client-error.log",
      out_file: "/home/mwp/.pm2/logs/mwp-client-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
    {
      name: 'mwp-admin',
      cwd: '/var/www/mwp/front',
      script: 'npm',
      args: 'run preview',
      env: {
        PORT: 4173,
        NODE_ENV: 'production',
        HOST: '0.0.0.0'
      },
      error_file: "/home/mwp/.pm2/logs/mwp-admin-error.log",
      out_file: "/home/mwp/.pm2/logs/mwp-admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
    {
      name: 'mwp-server',
      cwd: '/var/www/mwp/server',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 4000,
        NODE_ENV: 'production'
      },
      error_file: "/home/mwp/.pm2/logs/mwp-server-error.log",
      out_file: "/home/mwp/.pm2/logs/mwp-server-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
  ]
};