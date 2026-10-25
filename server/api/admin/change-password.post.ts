import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { z } from 'zod'
import { hashPassword } from 'better-auth/crypto'
import { isAdmin, requireAdminSession } from '../../utils/admin'
import { logTarget } from '../../utils/activity-log'

const changePasswordSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi'),
	newPassword: z.string().min(8, 'Password baru minimal 8 karakter')
})

export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)

	const body = await readBodyWith(event, changePasswordSchema)

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

	// Mengganti kata sandi admin lain sama dengan mengambil alih akunnya, jadi hanya boleh untuk akun sendiri.
	if (targetUser.id !== session.user.id && isAdmin(targetUser)) {
		throw createError({
			status: 403,
			statusText: 'Kata sandi admin lain tidak bisa diganti dari sini. Minta pemilik akun menggantinya sendiri.'
		})
	}

	logTarget(event, { userId: targetUser.id, name: targetUser.name })

	const hashedPassword = await hashPassword(body.newPassword)
	const now = new Date()

	// Find credential account
	const [existingAccount] = await db
		.select()
		.from(schema.account)
		.where(
			and(
				eq(schema.account.userId, body.userId),
				eq(schema.account.providerId, 'credential')
			)
		)

	if (existingAccount) {
		await db
			.update(schema.account)
			.set({
				password: hashedPassword,
				updatedAt: now
			})
			.where(eq(schema.account.id, existingAccount.id))
	} else {
		await db
			.insert(schema.account)
			.values({
				id: crypto.randomUUID(),
				accountId: targetUser.email,
				providerId: 'credential',
				userId: targetUser.id,
				password: hashedPassword,
				createdAt: now,
				updatedAt: now
			})
	}

	// Sesi yang masih terbuka ikut ditutup, supaya kata sandi baru benar-benar mengunci akun.
	if (targetUser.id !== session.user.id) {
		await db.delete(schema.session).where(eq(schema.session.userId, targetUser.id))
	}

	return {
		success: true,
		message: `Kata sandi akun ${targetUser.email} sudah diganti.`
	}
})
