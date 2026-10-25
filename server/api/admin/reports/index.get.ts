import { z } from 'zod'
import { alias } from 'drizzle-orm/sqlite-core'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'

const querySchema = z.object({
	status: z.enum(['baru', 'selesai']).default('baru')
})

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)
	const query = getQueryWith(event, querySchema)
	const reporter = alias(schema.user, 'reporter')
	const owner = alias(schema.user, 'owner')

	const rows = await db.select({
		id: schema.contentReports.id,
		targetType: schema.contentReports.targetType,
		reason: schema.contentReports.reason,
		note: schema.contentReports.note,
		status: schema.contentReports.status,
		createdAt: schema.contentReports.createdAt,
		resolvedAt: schema.contentReports.resolvedAt,
		commentId: schema.contentReports.commentId,
		commentBody: schema.projectComments.body,
		projectId: schema.projects.id,
		projectTitle: schema.projects.title,
		projectSlug: schema.projects.slug,
		ownerName: owner.name,
		ownerUsername: owner.username,
		reporterName: reporter.name,
		reporterUsername: reporter.username
	})
		.from(schema.contentReports)
		.leftJoin(reporter, eq(schema.contentReports.reporterId, reporter.id))
		.leftJoin(schema.projects, eq(schema.contentReports.projectId, schema.projects.id))
		.leftJoin(schema.projectComments, eq(schema.contentReports.commentId, schema.projectComments.id))
		.leftJoin(owner, eq(schema.projects.userId, owner.id))
		.where(eq(schema.contentReports.status, query.status))
		.orderBy(desc(schema.contentReports.createdAt))
		.limit(200)

	return { reports: rows }
})
