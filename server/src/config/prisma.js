import { PrismaClient } from '@prisma/client';
import { ENV } from './env.js';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__db__;
}

export default prisma;
