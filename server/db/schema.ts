import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password'), // Nullable for OAuth-only users
	avatarUrl: text('avatar_url'),
	provider: text('provider').notNull().default('local'), // 'local' | 'github' | 'google'
	providerId: text('provider_id'),
	role: text('role').notNull().default('member'), // 'member' | 'contributor' | 'admin'
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
})

export type UserRecord = typeof users.$inferSelect
export type NewUserRecord = typeof users.$inferInsert
