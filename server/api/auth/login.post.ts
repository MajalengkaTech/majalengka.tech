import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const loginSchema = z.object({
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(1, 'Password wajib diisi')
})

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, loginSchema.parse)

	const email = body.email.toLowerCase().trim()

	const user = await db.query.users.findFirst({
		where: eq(schema.users.email, email)
	})

	if (!user || !user.password) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Email atau kata sandi tidak sesuai.'
		})
	}

	const isPasswordValid = await verifyPassword(user.password, body.password)
	if (!isPasswordValid) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Email atau kata sandi tidak sesuai.'
		})
	}

	await setUserSession(event, {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			avatar: user.avatarUrl || undefined,
			provider: user.provider as 'local' | 'github' | 'google'
		}
	})

	return {
		success: true,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			avatar: user.avatarUrl,
			provider: user.provider
		}
	}
})
