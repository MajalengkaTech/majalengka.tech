import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../../../utils/admin'
import { parseProjectId, requireSignedIn } from '../../../../utils/project-access'

// Komentar boleh dihapus oleh penulisnya, pemilik proyek, atau admin.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const projectId = parseProjectId(event)
	const commentId = Number(getRouterParam(event, 'commentId'))
	if (!Number.isInteger(commentId) || commentId <= 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID komentar tidak valid'
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
			statusCode: 404,
			statusMessage: 'Komentar tidak ditemukan'
		})
	}

	const userId = String(session.user.id)
	if (row.commentUserId !== userId && row.projectUserId !== userId && !isAdmin(session.user)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Kamu tidak bisa menghapus komentar ini'
		})
	}

	await db.delete(schema.projectComments).where(eq(schema.projectComments.id, commentId))

	return {
		success: true,
		message: 'Komentar dihapus'
	}
})
