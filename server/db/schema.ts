import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from '#auth/schema'

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	tagline: text('tagline'),
	description: text('description').notNull(),
	category: text('category').notNull().default('lainnya'),
	contribution: text('contribution'),
	thumbnailUrl: text('thumbnail_url'),
	repoUrl: text('repo_url'),
	demoUrl: text('demo_url'),
	designUrl: text('design_url'),
	tags: text('tags'), // Comma-separated tags
	isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
	isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
	featuredAt: integer('featured_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
}, table => [
	index('projects_user_id_idx').on(table.userId),
	index('projects_published_created_idx').on(table.isPublished, table.createdAt),
	index('projects_category_idx').on(table.category)
])

export const projectImages = sqliteTable('project_images', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	alt: text('alt'),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, table => [
	index('project_images_project_idx').on(table.projectId, table.sortOrder)
])

export const projectLikes = sqliteTable('project_likes', {
	projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, table => [
	primaryKey({ columns: [table.projectId, table.userId] }),
	index('project_likes_user_idx').on(table.userId)
])

export const projectComments = sqliteTable('project_comments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	body: text('body').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
}, table => [
	index('project_comments_project_idx').on(table.projectId, table.createdAt)
])

export type ProjectRecord = typeof projects.$inferSelect
export type NewProjectRecord = typeof projects.$inferInsert
export type ProjectImageRecord = typeof projectImages.$inferSelect
export type ProjectCommentRecord = typeof projectComments.$inferSelect
