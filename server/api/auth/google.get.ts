import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineOAuthGoogleEventHandler({
	async onSuccess(event, { user }) {
		const email = (user.email || `${user.sub}@accounts.google.com`).toLowerCase()
		const now = new Date()

		let dbUser = await db.query.users.findFirst({
			where: eq(schema.users.email, email)
		})

		if (!dbUser) {
			const [created] = await db.insert(schema.users).values({
				name: user.name || 'Google User',
				email,
				avatarUrl: user.picture,
				provider: 'google',
				providerId: user.sub,
				role: 'member',
				createdAt: now,
				updatedAt: now
			}).returning()
			dbUser = created
		} else {
			await db.update(schema.users).set({
				name: user.name || dbUser.name,
				avatarUrl: user.picture || dbUser.avatarUrl,
				providerId: user.sub,
				updatedAt: now
			}).where(eq(schema.users.id, dbUser.id))
		}

		if (!dbUser) {
			return sendRedirect(event, '/login?error=google')
		}

		await setUserSession(event, {
			user: {
				id: dbUser.id,
				name: dbUser.name,
				email: dbUser.email,
				avatar: dbUser.avatarUrl || undefined,
				provider: 'google'
			}
		})
		return sendRedirect(event, '/')
	},
	onError(event, error) {
		console.error('Google OAuth error:', error)
		return sendRedirect(event, '/login?error=google')
	}
})
