import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const registerSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter')
})

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, registerSchema.parse)

	const email = body.email.toLowerCase().trim()

	const existingUser = await db.query.users.findFirst({
		where: eq(schema.users.email, email)
	})

	if (existingUser) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Email sudah terdaftar. Silakan login atau gunakan email lain.'
		})
	}

	const hashedPassword = await hashPassword(body.password)
	const now = new Date()
	const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`

	const [newUser] = await db.insert(schema.users).values({
		name: body.name.trim(),
		email,
		password: hashedPassword,
		avatarUrl,
		provider: 'local',
		role: 'member',
		createdAt: now,
		updatedAt: now
	}).returning()

	if (!newUser) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Gagal membuat pengguna baru.'
		})
	}

	await setUserSession(event, {
		user: {
			id: newUser.id,
			name: newUser.name,
			email: newUser.email,
			avatar: newUser.avatarUrl || undefined,
			provider: 'local'
		}
	})

	return {
		success: true,
		user: {
			id: newUser.id,
			name: newUser.name,
			email: newUser.email,
			avatar: newUser.avatarUrl,
			provider: 'local'
		}
	}
})
