import { z } from 'zod'
import { and, eq, ne } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireSignedIn } from '../../utils/project-access'

const querySchema = z.object({
	username: z.string().max(60)
})

// Pengecekan cepat untuk form profil; penyimpanan tetap memeriksa ulang di profile.patch.ts.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const { username } = await getQueryWith(event, querySchema)

	const parsed = usernameSchema.safeParse(username)
	if (!parsed.success) {
		return { available: false, username: username.trim().toLowerCase(), message: parsed.error.issues[0]?.message || 'Username tidak valid' }
	}

	const [taken] = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(and(eq(schema.user.username, parsed.data), ne(schema.user.id, String(session.user.id))))
		.limit(1)

	return taken
		? { available: false, username: parsed.data, message: `@${parsed.data} sudah dipakai kreator lain` }
		: { available: true, username: parsed.data, message: `@${parsed.data} tersedia` }
})
