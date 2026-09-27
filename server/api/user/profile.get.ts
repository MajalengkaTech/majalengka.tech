import { count, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireSignedIn } from '../../utils/project-access'
import { toPrivateProfile } from '../../utils/profile'

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)

	const user = await db.query.user.findFirst({
		where: eq(schema.user.id, String(session.user.id))
	})

	if (!user) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan'
		})
	}

	const [countRow] = await db
		.select({ total: count() })
		.from(schema.projects)
		.where(eq(schema.projects.userId, user.id))

	return {
		user: toPrivateProfile(user),
		projectCount: countRow?.total ?? 0
	}
})
