import type { H3Event } from 'h3'

export const SUPER_ADMIN_EMAIL = 'dinarpermadi07@gmail.com'

export async function requireAdminSession(event: H3Event) {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized: Silakan login terlebih dahulu'
		})
	}

	const role = (session.user as { role?: string })?.role
	const email = session.user.email?.toLowerCase()

	if (role !== 'admin' && email !== SUPER_ADMIN_EMAIL.toLowerCase()) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden: Hanya untuk administrator'
		})
	}

	return session
}
