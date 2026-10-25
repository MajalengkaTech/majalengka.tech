import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { z } from 'zod'
import { isSuperAdmin, requireAdminSession } from '../../utils/admin'
import { logTarget } from '../../utils/activity-log'

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
			status: 404,
			statusText: 'Pengguna tidak ditemukan'
		})
	}

	// Prevent demoting super admin
	if (isSuperAdmin(targetUser.id) && body.role !== 'admin') {
		throw createError({
			status: 400,
			statusText: 'Peran Super Admin utama tidak bisa diubah.'
		})
	}

	logTarget(event, { userId: targetUser.id, name: targetUser.name, role: body.role })

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
