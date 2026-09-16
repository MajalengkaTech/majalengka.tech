import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const oauthHandler = defineOAuthGitHubEventHandler({
	config: {
		emailRequired: true
	},
	async onSuccess(event, { user }) {
		const email = (user.email || `${user.login}@users.noreply.github.com`).toLowerCase()
		const now = new Date()

		let dbUser = await db.query.users.findFirst({
			where: eq(schema.users.email, email)
		})

		if (!dbUser) {
			const [created] = await db.insert(schema.users).values({
				name: user.name || user.login,
				email,
				avatarUrl: user.avatar_url,
				provider: 'github',
				providerId: String(user.id),
				role: 'member',
				createdAt: now,
				updatedAt: now
			}).returning()
			dbUser = created
		} else {
			await db.update(schema.users).set({
				name: user.name || user.login || dbUser.name,
				avatarUrl: user.avatar_url || dbUser.avatarUrl,
				providerId: String(user.id),
				updatedAt: now
			}).where(eq(schema.users.id, dbUser.id))
		}

		if (!dbUser) {
			return sendRedirect(event, '/login?error=github')
		}

		await setUserSession(event, {
			user: {
				id: dbUser.id,
				name: dbUser.name,
				login: user.login,
				email: dbUser.email,
				avatar: dbUser.avatarUrl || undefined,
				provider: 'github'
			}
		})
		return sendRedirect(event, '/')
	},
	onError(event, error) {
		console.error('GitHub OAuth error:', error)
		return sendRedirect(event, '/login?error=github')
	}
})

export default defineEventHandler(async (event) => {
	try {
		return await oauthHandler(event)
	} catch (error) {
		console.error('GitHub OAuth unhandled exception:', error)
		return sendRedirect(event, '/login?error=github')
	}
})
