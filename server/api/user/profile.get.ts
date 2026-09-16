import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		})
	}

	const user = await db.query.user.findFirst({
		where: eq(schema.user.id, session.user.id)
	})

	if (!user) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan'
		})
	}

	const userProjects = await db.query.projects.findMany({
		where: eq(schema.projects.userId, user.id)
	})

	return {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			avatarUrl: user.image,
			bio: (user as { bio?: string }).bio || null,
			githubUsername: (user as { githubUsername?: string }).githubUsername || null,
			websiteUrl: (user as { websiteUrl?: string }).websiteUrl || null,
			role: user.role || 'user',
			createdAt: user.createdAt
		},
		projectCount: userProjects.length
	}
})
