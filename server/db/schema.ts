import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password'), // Nullable for OAuth-only users
	avatarUrl: text('avatar_url'),
	bio: text('bio'),
	githubUsername: text('github_username'),
	websiteUrl: text('website_url'),
	provider: text('provider').notNull().default('local'), // 'local' | 'github' | 'google'
	providerId: text('provider_id'),
	role: text('role').notNull().default('member'), // 'member' | 'contributor' | 'admin'
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
})

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description').notNull(),
	thumbnailUrl: text('thumbnail_url'),
	repoUrl: text('repo_url'),
	demoUrl: text('demo_url'),
	tags: text('tags'), // Stored as comma-separated or JSON string
	isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
})

export type UserRecord = typeof users.$inferSelect
export type NewUserRecord = typeof users.$inferInsert
export type ProjectRecord = typeof projects.$inferSelect
export type NewProjectRecord = typeof projects.$inferInsert
