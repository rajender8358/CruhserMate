module.exports = {
  apps: [
    {
      name: 'crushermate-backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto-restart on crash
      autorestart: true,
      // Restart if app is not responding
      kill_timeout: 5000,
      // Wait before restarting
      wait_ready: true,
      // Listen for ready signal
      listen_timeout: 10000,
      // Graceful shutdown
      shutdown_with_message: true,
    },
  ],
};
