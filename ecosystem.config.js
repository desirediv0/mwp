module.exports = {
  apps: [
    {
      name: 'mwp-client',
      cwd: '/root/mwp/client',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3007,
        NODE_ENV: 'production'
      },
      error_file: "/root/.pm2/logs/mwp-client-error.log",
      out_file: "/root/.pm2/logs/mwp-client-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
    {
      name: 'mwp-admin',
      cwd: '/root/mwp/front',
      script: 'npm',
      args: 'run preview',
      env: {
        PORT: 4178,
        NODE_ENV: 'production',
        HOST: '0.0.0.0'
      },
      error_file: "/root/.pm2/logs/mwp-admin-error.log",
      out_file: "/root/.pm2/logs/mwp-admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
    {
      name: 'mwp-server',
      cwd: '/root/mwp/server',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 4008,
        NODE_ENV: 'production'
      },
      error_file: "/root/.pm2/logs/mwp-server-error.log",
      out_file: "/root/.pm2/logs/mwp-server-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
  ]
};