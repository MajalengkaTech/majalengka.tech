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

// Nomor versi data publik. Naik setiap ada perubahan lewat API dan ikut jadi kunci cache edge (server/lib/edge-cache.ts).
export const cacheVersions = sqliteTable('cache_versions', {
	key: text('key').primaryKey(),
	version: integer('version').notNull().default(0)
})

// Notifikasi untuk pemilik proyek saat proyeknya diapresiasi atau dikomentari orang lain.
export const notifications = sqliteTable('notifications', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
	type: text('type').notNull(), // 'like' | 'comment'
	projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
	commentId: integer('comment_id'),
	readAt: integer('read_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, table => [
	index('notifications_user_idx').on(table.userId, table.createdAt),
	index('notifications_project_idx').on(table.projectId)
])

// Laporan proyek atau komentar yang tidak pantas dari pengguna, ditinjau pengelola di /kelola/laporan.
export const contentReports = sqliteTable('content_reports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	reporterId: text('reporter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	targetType: text('target_type').notNull(), // 'project' | 'comment'
	projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
	commentId: integer('comment_id'),
	reason: text('reason').notNull(),
	note: text('note'),
	status: text('status').notNull().default('baru'), // 'baru' | 'selesai'
	resolvedBy: text('resolved_by'),
	resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, table => [
	index('content_reports_status_idx').on(table.status, table.createdAt),
	index('content_reports_project_idx').on(table.projectId)
])

export type ProjectRecord = typeof projects.$inferSelect
export type NewProjectRecord = typeof projects.$inferInsert
export type ProjectImageRecord = typeof projectImages.$inferSelect
export type ProjectCommentRecord = typeof projectComments.$inferSelect
