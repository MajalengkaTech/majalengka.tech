import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSignedIn } from '../../utils/project-access'

const querySchema = z.object({
	ids: z.string().trim().max(1000).transform(value => [...new Set(value.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0))].slice(0, 100))
})

// Proyek mana saja (dari daftar ids) yang sudah diapresiasi pengguna ini. Dipakai halaman yang HTML-nya
// datang dari cache edge, karena versi itu dirender untuk pengunjung anonim (server/lib/edge-cache.ts).
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const { ids } = await getQueryWith(event, querySchema)
	if (!ids.length) return { liked: [] as number[] }

	const rows = await db.select({ projectId: schema.projectLikes.projectId })
		.from(schema.projectLikes)
		.where(and(
			eq(schema.projectLikes.userId, String(session.user.id)),
			inArray(schema.projectLikes.projectId, ids)
		))

	return { liked: rows.map(row => row.projectId) }
})
