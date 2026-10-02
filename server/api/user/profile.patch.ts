import { and, eq, ne } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireSignedIn } from '../../utils/project-access'
import { toPrivateProfile } from '../../utils/profile'

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const userId = String(session.user.id)
	const body = await readBodyWith(event, profileInputSchema)
	const username = body.username || null

	if (username) {
		const [taken] = await db
			.select({ id: schema.user.id })
			.from(schema.user)
			.where(and(eq(schema.user.username, username), ne(schema.user.id, userId)))
			.limit(1)
		if (taken) {
			throw createError({
				statusCode: 409,
				statusMessage: `Username @${username} sudah dipakai kreator lain`
			})
		}
	}

	const text = (value?: string | null) => value?.trim() || null
	// Field yang tidak dikirim dibiarkan apa adanya, supaya form lama tidak menghapus data profil baru.
	const changes: Partial<typeof schema.user.$inferInsert> = {
		name: body.name,
		updatedAt: new Date()
	}
	if (body.username !== undefined) changes.username = username
	if (body.bio !== undefined) changes.bio = text(body.bio)
	if (body.avatarUrl !== undefined) changes.image = text(body.avatarUrl)
	if (body.creatorRole !== undefined) changes.creatorRole = body.creatorRole || null
	if (body.location !== undefined) changes.location = text(body.location)
	if (body.skills !== undefined) changes.skills = text(body.skills)
	if (body.openToWork !== undefined) changes.openToWork = body.openToWork
	if (body.githubUsername !== undefined) changes.githubUsername = text(body.githubUsername)?.replace(/^@/, '') || null
	if (body.websiteUrl !== undefined) changes.websiteUrl = text(body.websiteUrl)
	if (body.designUrl !== undefined) changes.designUrl = text(body.designUrl)
	if (body.linkedinUrl !== undefined) changes.linkedinUrl = text(body.linkedinUrl)

	const [updatedUser] = await db.update(schema.user)
		.set(changes)
		.where(eq(schema.user.id, userId))
		.returning()

	if (!updatedUser) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan'
		})
	}

	return {
		success: true,
		user: toPrivateProfile(updatedUser)
	}
})
