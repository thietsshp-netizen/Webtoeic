import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`
const isDev = process.env.NODE_ENV !== 'production'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

// 1. Chỉ khởi tạo PG Pool một lần duy nhất và lưu vào global để tránh rò rỉ kết nối khi hot-reload
const pool = globalForPrisma.pgPool ?? new Pool({ 
  connectionString, 
  max: isDev ? 2 : 8 
})

if (isDev) globalForPrisma.pgPool = pool

// 2. Chỉ khởi tạo Prisma Client một lần duy nhất
const prismaClientSingleton = () => {
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma