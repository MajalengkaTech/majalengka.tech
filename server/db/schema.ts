import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').notNull(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description').notNull(),
	thumbnailUrl: text('thumbnail_url'),
	repoUrl: text('repo_url'),
	demoUrl: text('demo_url'),
	tags: text('tags'), // Comma-separated tags
	isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
})

export type ProjectRecord = typeof projects.$inferSelect
export type NewProjectRecord = typeof projects.$inferInsert
