import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../utils/admin'
import { creatorCardPath, getCreatorStats } from '../../utils/creator-stats'

const MAX_BYTES = 1.5 * 1024 * 1024
const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

// Kartu digambar di browser; server memvalidasi PNG 1200x630, menghitung stats asli dari database, dan menyimpannya ke R2.
export default defineEventHandler(async (event) => {
	const session = await getUserSession(event).catch(() => null)
	if (!session?.user?.id) {
		throw createError({ status: 401, statusText: 'Masuk dulu untuk melanjutkan.' })
	}
	const query = getQuery(event)
	const requestedUserId = query.userId ? String(query.userId).trim() : null

	let targetUserId = String(session.user.id)

	// Kartu orang lain hanya boleh diunggah admin; tanpa ini siapa pun bisa menaruh gambar apa saja di domain ini.
	if (requestedUserId && requestedUserId !== targetUserId) {
		if (!isAdmin(session.user)) {
			throw createError({ status: 403, statusText: 'Kamu hanya bisa mengunggah kartumu sendiri.' })
		}
		const [validUser] = await db
			.select({ id: schema.user.id })
			.from(schema.user)
			.where(eq(schema.user.id, requestedUserId))
			.limit(1)
		if (!validUser) {
			throw createError({ status: 404, statusText: 'Pengguna tidak ditemukan. Muat ulang halaman lalu coba lagi.' })
		}
		targetUserId = requestedUserId
	}

	const parts = await readMultipartFormData(event)
	const file = parts?.find(part => part.name === 'card')
	if (!file?.data?.length) {
		throw createError({ status: 400, statusText: 'Gambar kartu tidak ditemukan' })
	}

	const data = file.data
	const isPng = PNG_SIGNATURE.every((byte, index) => data[index] === byte)
	const width = data.length > 24 ? data.readUInt32BE(16) : 0
	const height = data.length > 24 ? data.readUInt32BE(20) : 0
	if (!isPng || width !== CARD_WIDTH || height !== CARD_HEIGHT || data.length > MAX_BYTES) {
		throw createError({ status: 400, statusText: 'Kartu harus berupa PNG 1200x630 dan maksimal 1,5 MB' })
	}

	const stats = await getCreatorStats(targetUserId)
	await blob.put(creatorCardPath(targetUserId), data, {
		contentType: 'image/png',
		customMetadata: {
			projectCount: String(stats.projectCount),
			likeCount: String(stats.likeCount),
			rank: String(stats.rank)
		}
	})

	return {
		success: true,
		url: `/api/files/${creatorCardPath(targetUserId)}?v=${Date.now()}`,
		stats
	}
})
