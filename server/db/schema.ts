import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

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

export const projectReviews = sqliteTable('project_reviews', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),
	rating: integer('rating').notNull(),
	comment: text('comment'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
}, table => [
	uniqueIndex('project_user_review_unique').on(table.projectId, table.userId)
])

export type ProjectRecord = typeof projects.$inferSelect
export type NewProjectRecord = typeof projects.$inferInsert
export type ProjectReviewRecord = typeof projectReviews.$inferSelect
export type NewProjectReviewRecord = typeof projectReviews.$inferInsert
