import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { hashPassword } from 'better-auth/crypto'
import { requireAdminSession } from '../../utils/admin'

const changePasswordSchema = z.object({
	userId: z.string().min(1, 'User ID wajib diisi'),
	newPassword: z.string().min(8, 'Password baru minimal 8 karakter')
})

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)

	const body = await readValidatedBody(event, changePasswordSchema.parse)

	// Verify target user exists
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

	return {
		success: true,
		message: `Password untuk akun ${targetUser.email} berhasil diperbarui.`
	}
})
