import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const updateProfileSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
	bio: z.string().max(500, 'Bio maksimal 500 karakter').optional().nullable(),
	avatarUrl: z.string().url('URL avatar tidak valid').or(z.literal('')).optional().nullable(),
	githubUsername: z.string().max(50, 'Username GitHub maksimal 50 karakter').optional().nullable(),
	websiteUrl: z.string().url('URL website tidak valid').or(z.literal('')).optional().nullable()
})

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		})
	}

	const body = await readValidatedBody(event, updateProfileSchema.parse)
	const now = new Date()

	const [updatedUser] = await db.update(schema.users).set({
		name: body.name.trim(),
		bio: body.bio?.trim() || null,
		avatarUrl: body.avatarUrl?.trim() || null,
		githubUsername: body.githubUsername?.trim()?.replace(/^@/, '') || null,
		websiteUrl: body.websiteUrl?.trim() || null,
		updatedAt: now
	}).where(eq(schema.users.id, Number(session.user.id))).returning()

	if (!updatedUser) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan'
		})
	}

	await setUserSession(event, {
		user: {
			id: updatedUser.id,
			name: updatedUser.name,
			email: updatedUser.email,
			avatar: updatedUser.avatarUrl || undefined,
			provider: updatedUser.provider
		}
	})

	return {
		success: true,
		user: {
			id: updatedUser.id,
			name: updatedUser.name,
			email: updatedUser.email,
			avatarUrl: updatedUser.avatarUrl,
			bio: updatedUser.bio,
			githubUsername: updatedUser.githubUsername,
			websiteUrl: updatedUser.websiteUrl,
			role: updatedUser.role,
			provider: updatedUser.provider
		}
	}
})
