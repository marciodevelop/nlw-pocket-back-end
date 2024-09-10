import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '../env'

export const cleint = postgres(env.DATABASE_URL)

export const db = drizzle(cleint, { schema, logger: true })
