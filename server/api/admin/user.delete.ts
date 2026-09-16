import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { requireAdminSession, SUPER_ADMIN_EMAIL } from '../../utils/admin'

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

	if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Akun Super Admin utama tidak dapat dihapus'
		})
	}

	// Delete associated projects
	await db
		.delete(schema.projects)
		.where(eq(schema.projects.userId, body.userId))

	// Delete associated accounts
	await db
		.delete(schema.account)
		.where(eq(schema.account.userId, body.userId))

	// Delete associated sessions
	await db
		.delete(schema.session)
		.where(eq(schema.session.userId, body.userId))

	// Delete user
	await db
		.delete(schema.user)
		.where(eq(schema.user.id, body.userId))

	return {
		success: true,
		message: `Akun ${targetUser.name || targetUser.email} berhasil dihapus dari database.`
	}
})
