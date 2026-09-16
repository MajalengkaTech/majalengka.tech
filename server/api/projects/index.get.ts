import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const isMine = query.mine === 'true' || query.mine === '1'

	if (isMine) {
		const session = await getUserSession(event)
		if (!session?.user?.id) {
			throw createError({
				statusCode: 401,
				statusMessage: 'Unauthorized'
			})
		}

		const myProjects = await db.query.projects.findMany({
			where: eq(schema.projects.userId, session.user.id),
			orderBy: [desc(schema.projects.createdAt)]
		})

		return {
			projects: myProjects
		}
	}

	// Public showcase projects
	const allProjects = await db.query.projects.findMany({
		where: eq(schema.projects.isPublished, true),
		orderBy: [desc(schema.projects.createdAt)]
	})

	// Enrich with author info
	const userIds = [...new Set(allProjects.map(p => p.userId))]
	const authors = userIds.length > 0
		? await db.query.user.findMany({
				where: (user, { inArray }) => inArray(user.id, userIds)
			})
		: []

	const authorMap = new Map(authors.map(u => [u.id, {
		id: u.id,
		name: u.name,
		avatarUrl: u.image,
		githubUsername: null
	}]))

	const enriched = allProjects.map(p => ({
		...p,
		author: authorMap.get(p.userId) || {
			id: p.userId,
			name: 'Komunitas Majalengka',
			avatarUrl: null,
			githubUsername: null
		}
	}))

	return {
		projects: enriched
	}
})
