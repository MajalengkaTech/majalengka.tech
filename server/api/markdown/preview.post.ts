import { z } from 'zod'
import { defineEventHandler } from 'nuxt/server'
import { renderComark } from '../../utils/comark'
import { requireSignedIn } from '../../utils/project-access'

// Pratinjau editor memakai renderer yang sama dengan halaman publik, jadi yang dilihat penulis sama dengan hasil terbitnya.
const bodySchema = z.object({
	markdown: z.string().max(30000, 'Isi terlalu panjang untuk dipratinjau (maksimal 30.000 karakter).'),
	mode: z.enum(['cerita', 'tutorial'])
})

export default defineEventHandler(async (event) => {
	await requireSignedIn(event, 'Masuk dulu untuk melihat pratinjau.')
	const body = await readBodyWith(event, bodySchema)
	return renderComark(body.markdown, body.mode)
})
