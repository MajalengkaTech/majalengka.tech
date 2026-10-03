import type { H3Event } from 'h3'

interface SessionUserLike {
	id?: string | number
	role?: string | null
}

// Super admin ditentukan lewat ID user (NUXT_SUPER_ADMIN_IDS), bukan email, karena email bisa didaftarkan tanpa verifikasi.
export function getSuperAdminIds(): string[] {
	const raw = useRuntimeConfig().superAdminIds || ''
	return raw.split(',').map(id => id.trim()).filter(Boolean)
}

export function isSuperAdmin(userId?: string | number | null) {
	return !!userId && getSuperAdminIds().includes(String(userId))
}

export function isAdmin(user?: SessionUserLike | null) {
	return user?.role === 'admin' || isSuperAdmin(user?.id)
}

export async function requireAdminSession(event: H3Event) {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Masuk dulu untuk melanjutkan.'
		})
	}

	if (!isAdmin(session.user as SessionUserLike)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Halaman ini khusus admin.'
		})
	}

	return session
}
