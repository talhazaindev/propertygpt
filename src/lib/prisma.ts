import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Add MongoDB connection options to avoid transactions requirement
// See: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/mongodb-database
const mongoOptions = {
  transactionOptions: {
    // This disables transactions in MongoDB, which means the database doesn't need to be a replica set
    maxCommitTimeMS: 0,
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(mongoOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 