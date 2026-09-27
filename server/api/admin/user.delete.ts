import { eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { isSuperAdmin, requireAdminSession } from '../../utils/admin'
import { deleteOwnedBlob } from '../../utils/project-blob'

const deleteUserSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi')
})

export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)

	const body = await readValidatedBody(event, deleteUserSchema.parse)

	if (session.user.id === body.userId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login'
		})
	}

	const [targetUser] = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.id, body.userId))

	if (!targetUser) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan'
		})
	}

	if (isSuperAdmin(targetUser.id)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Akun Super Admin utama tidak dapat dihapus'
		})
	}

	const userProjects = await db
		.select({ id: schema.projects.id, thumbnailUrl: schema.projects.thumbnailUrl })
		.from(schema.projects)
		.where(eq(schema.projects.userId, body.userId))
	const projectIds = userProjects.map(p => p.id)

	// Semua relasi dihapus eksplisit karena cascade FK tidak aktif di SQLite lokal.
	await db.batch([
		db.delete(schema.projectReviews).where(eq(schema.projectReviews.userId, body.userId)),
		...(projectIds.length > 0
			? [
					db.delete(schema.projectReviews).where(inArray(schema.projectReviews.projectId, projectIds)),
					db.delete(schema.projects).where(inArray(schema.projects.id, projectIds))
				]
			: []),
		db.delete(schema.account).where(eq(schema.account.userId, body.userId)),
		db.delete(schema.session).where(eq(schema.session.userId, body.userId)),
		db.delete(schema.user).where(eq(schema.user.id, body.userId))
	])

	for (const project of userProjects) {
		await deleteOwnedBlob(project.thumbnailUrl, body.userId)
	}

	return {
		success: true,
		message: `Akun ${targetUser.name || targetUser.email} berhasil dihapus dari database.`
	}
})
