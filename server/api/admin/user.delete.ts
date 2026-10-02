import { eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { isSuperAdmin, requireAdminSession } from '../../utils/admin'
import { deleteOwnedBlob } from '../../utils/project-blob'
import { creatorCardPath } from '../../utils/creator-stats'

const deleteUserSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi')
})

export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)

	const body = await readBodyWith(event, deleteUserSchema)

	if (session.user.id === body.userId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Kamu tidak bisa menghapus akunmu sendiri dari panel admin. Minta admin lain bila perlu.'
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
		.select({ thumbnailUrl: schema.projects.thumbnailUrl })
		.from(schema.projects)
		.where(eq(schema.projects.userId, body.userId))
	const userImages = await db
		.select({ url: schema.projectImages.url })
		.from(schema.projectImages)
		.innerJoin(schema.projects, eq(schema.projectImages.projectId, schema.projects.id))
		.where(eq(schema.projects.userId, body.userId))

	// Subquery per user, bukan inArray(ids), karena D1 membatasi 100 parameter per query.
	const ownProjectIds = db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.userId, body.userId))

	// Semua relasi dihapus eksplisit karena cascade FK tidak aktif di SQLite lokal.
	await db.batch([
		db.delete(schema.projectComments).where(eq(schema.projectComments.userId, body.userId)),
		db.delete(schema.projectLikes).where(eq(schema.projectLikes.userId, body.userId)),
		db.delete(schema.projectComments).where(inArray(schema.projectComments.projectId, ownProjectIds)),
		db.delete(schema.projectLikes).where(inArray(schema.projectLikes.projectId, ownProjectIds)),
		db.delete(schema.projectImages).where(inArray(schema.projectImages.projectId, ownProjectIds)),
		db.delete(schema.projects).where(eq(schema.projects.userId, body.userId)),
		db.delete(schema.account).where(eq(schema.account.userId, body.userId)),
		db.delete(schema.session).where(eq(schema.session.userId, body.userId)),
		db.delete(schema.user).where(eq(schema.user.id, body.userId))
	])

	for (const url of [...userProjects.map(p => p.thumbnailUrl), ...userImages.map(image => image.url)]) {
		await deleteOwnedBlob(url, body.userId)
	}
	await blob.delete(creatorCardPath(body.userId)).catch(() => {})

	return {
		success: true,
		message: `Akun ${targetUser.name || targetUser.email} berhasil dihapus dari database.`
	}
})
