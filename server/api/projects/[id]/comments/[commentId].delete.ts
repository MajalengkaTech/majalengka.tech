import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { isAdmin } from '../../../../utils/admin'
import { parseProjectId, requireSignedIn } from '../../../../utils/project-access'

// Komentar boleh dihapus oleh penulisnya, pemilik proyek, atau admin.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const projectId = parseProjectId(event)
	const commentId = Number(getRouterParam(event, 'commentId', { decode: true }))
	if (!Number.isInteger(commentId) || commentId <= 0) {
		throw createError({
			status: 400,
			statusText: 'ID komentar tidak valid'
		})
	}

	const [row] = await db
		.select({ commentUserId: schema.projectComments.userId, projectUserId: schema.projects.userId })
		.from(schema.projectComments)
		.innerJoin(schema.projects, eq(schema.projectComments.projectId, schema.projects.id))
		.where(and(eq(schema.projectComments.id, commentId), eq(schema.projectComments.projectId, projectId)))
		.limit(1)

	if (!row) {
		throw createError({
			status: 404,
			statusText: 'Komentar tidak ditemukan'
		})
	}

	const userId = String(session.user.id)
	if (row.commentUserId !== userId && row.projectUserId !== userId && !isAdmin(session.user)) {
		throw createError({
			status: 403,
			statusText: 'Kamu tidak bisa menghapus komentar ini'
		})
	}

	await db.delete(schema.projectComments).where(eq(schema.projectComments.id, commentId))

	return {
		success: true,
		message: 'Komentar dihapus'
	}
})
