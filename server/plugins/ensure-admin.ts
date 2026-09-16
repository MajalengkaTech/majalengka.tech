import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineNitroPlugin(async () => {
	const superAdminEmail = 'dinarpermadi07@gmail.com'
	try {
		const [existingUser] = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.email, superAdminEmail))

		if (existingUser && existingUser.role !== 'admin') {
			await db
				.update(schema.user)
				.set({ role: 'admin' })
				.where(eq(schema.user.id, existingUser.id))
			console.log(`[Admin] Assigned admin role to ${superAdminEmail}`)
		}
	} catch (error) {
		console.warn('[Admin] Failed to check super admin on startup:', error)
	}
})
