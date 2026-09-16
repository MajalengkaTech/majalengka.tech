import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { requireAdminSession, SUPER_ADMIN_EMAIL } from '../../utils/admin'

const setRoleSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi'),
	role: z.enum(['admin', 'user'], { message: 'Role harus berupa admin atau user' })
})

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)

	const body = await readValidatedBody(event, setRoleSchema.parse)

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

	// Prevent demoting super admin
	if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && body.role !== 'admin') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Tidak dapat mengubah role Super Admin utama'
		})
	}

	await db
		.update(schema.user)
		.set({
			role: body.role,
			updatedAt: new Date()
		})
		.where(eq(schema.user.id, body.userId))

	return {
		success: true,
		message: `Role untuk ${targetUser.name || targetUser.email} berhasil diubah menjadi ${body.role}`
	}
})
