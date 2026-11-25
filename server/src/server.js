import app from './app.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import prisma from './config/prisma.js';
import cron from 'node-cron';
import { processDueReminders } from './modules/reminders/reminders.service.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 JeevanSYNC Backend Server running on port ${PORT} [${ENV.NODE_ENV}]`);
  logger.info(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
});

// Automated cron job: Check and dispatch due reminders every minute
cron.schedule('* * * * *', async () => {
  try {
    await processDueReminders();
  } catch (err) {
    logger.error('Cron job error processing reminders:', { error: err.message });
  }
});

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}, closing server and disconnecting database...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
