import type { ServerEvent } from './validation'

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

export async function requireAdminSession(event: ServerEvent) {
	const session = await getAuthSession(event)
	if (!session?.user?.id) {
		throw createError({
			status: 401,
			statusText: 'Masuk dulu untuk melanjutkan.'
		})
	}

	if (!isAdmin(session.user as SessionUserLike)) {
		throw createError({
			status: 403,
			statusText: 'Halaman ini khusus admin.'
		})
	}

	return session
}
