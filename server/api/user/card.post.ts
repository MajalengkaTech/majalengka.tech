import { requireSignedIn } from '../../utils/project-access'
import { creatorCardPath, getCreatorStats } from '../../utils/creator-stats'

const MAX_BYTES = 1.5 * 1024 * 1024
const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

// Kartu digambar di browser pemiliknya; server hanya menerima PNG 1200x630 dan menentukan sendiri path serta angkanya.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const userId = String(session.user.id)

	const parts = await readMultipartFormData(event)
	const file = parts?.find(part => part.name === 'card')
	if (!file?.data?.length) {
		throw createError({ statusCode: 400, statusMessage: 'Gambar kartu tidak ditemukan' })
	}

	const data = file.data
	const isPng = PNG_SIGNATURE.every((byte, index) => data[index] === byte)
	const width = data.length > 24 ? data.readUInt32BE(16) : 0
	const height = data.length > 24 ? data.readUInt32BE(20) : 0
	if (!isPng || width !== CARD_WIDTH || height !== CARD_HEIGHT || data.length > MAX_BYTES) {
		throw createError({ statusCode: 400, statusMessage: 'Kartu harus berupa PNG 1200x630 dan maksimal 1,5 MB' })
	}

	const stats = await getCreatorStats(userId)
	await blob.put(creatorCardPath(userId), data, {
		contentType: 'image/png',
		customMetadata: {
			projectCount: String(stats.projectCount),
			likeCount: String(stats.likeCount),
			rank: String(stats.rank)
		}
	})

	return {
		success: true,
		url: `/api/files/${creatorCardPath(userId)}?v=${Date.now()}`,
		stats
	}
})
