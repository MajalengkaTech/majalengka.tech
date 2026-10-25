import { defineEventHandler } from 'h3'
import { useLogger } from 'evlog'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Mencatat pelaku setiap aksi yang mengubah data di log aktivitas. Sesi di-cache per request oleh better-auth,
// jadi handler yang membaca sesi lagi tidak menambah query.
export default defineEventHandler(async (event) => {
	if (!WRITE_METHODS.has(event.method) || !event.path.startsWith('/api/') || event.path.startsWith('/api/auth/')) return

	const session = await getUserSession(event).catch(() => null)
	if (!session?.user?.id) return

	const user = session.user as { id: string | number, username?: string | null }
	useLogger(event).set({ user: { id: String(user.id), username: user.username ?? null } })
})
