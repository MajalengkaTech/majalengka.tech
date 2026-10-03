import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { isSuperAdmin, requireAdminSession } from '../../utils/admin'

const setRoleSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi'),
	role: z.enum(['admin', 'user'], { message: 'Pilih peran Admin atau Kreator.' })
})

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)

	const body = await readBodyWith(event, setRoleSchema)

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
	if (isSuperAdmin(targetUser.id) && body.role !== 'admin') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Peran Super Admin utama tidak bisa diubah.'
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
		message: `Peran ${targetUser.name || targetUser.email} sekarang ${body.role === 'admin' ? 'Admin' : 'Kreator'}`
	}
})
