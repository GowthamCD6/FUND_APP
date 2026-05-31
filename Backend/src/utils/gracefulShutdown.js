/**
 * Graceful Shutdown Handler
 * Ensures database connections are properly closed and no cleanup happens
 */

const db = require('../config/db');

let isShuttingDown = false;

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown(server) {
  const signals = ['SIGTERM', 'SIGINT'];

  signals.forEach(signal => {
    process.on(signal, async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`\n📍 Received ${signal}, starting graceful shutdown...\n`);

      try {
        // Close server from accepting new connections
        server.close(() => {
          console.log('✅ HTTP server closed');
        });

        // Close all database connections properly
        // THIS IS IMPORTANT: We only close the connection, we do NOT drop or delete anything
        db.end((err) => {
          if (err) {
            console.error('⚠️  Error closing database:', err.message);
          } else {
            console.log('✅ Database connections closed cleanly');
          }

          console.log('\n' + '═'.repeat(60));
          console.log('🛑 Application shut down gracefully');
          console.log('═'.repeat(60));
          console.log('\n📌 Your database and data are SAFE');
          console.log('   The database will persist until the next startup\n');

          process.exit(0);
        });

        // Force exit after 10 seconds if graceful shutdown fails
        setTimeout(() => {
          console.error('❌ Graceful shutdown timeout, forcing exit...');
          process.exit(1);
        }, 10000);

      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

module.exports = setupGracefulShutdown;
