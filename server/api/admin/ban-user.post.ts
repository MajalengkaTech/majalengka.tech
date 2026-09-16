import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { requireAdminSession, SUPER_ADMIN_EMAIL } from '../../utils/admin'

const banUserSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi'),
	banned: z.boolean(),
	banReason: z.string().max(255).optional().nullable()
})

export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)

	const body = await readValidatedBody(event, banUserSchema.parse)

	if (session.user.id === body.userId && body.banned) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Anda tidak dapat memblokir akun Anda sendiri'
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

	if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && body.banned) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Tidak dapat memblokir Super Admin utama'
		})
	}

	await db
		.update(schema.user)
		.set({
			banned: body.banned,
			banReason: body.banned ? (body.banReason || 'Ditangguhkan oleh administrator') : null,
			updatedAt: new Date()
		})
		.where(eq(schema.user.id, body.userId))

	// If banning user, revoke sessions
	if (body.banned) {
		await db
			.delete(schema.session)
			.where(eq(schema.session.userId, body.userId))
	}

	return {
		success: true,
		message: body.banned
			? `Pengguna ${targetUser.name || targetUser.email} telah ditangguhkan.`
			: `Akses pengguna ${targetUser.name || targetUser.email} telah dipulihkan.`
	}
})
