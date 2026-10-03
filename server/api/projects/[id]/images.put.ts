import { z } from 'zod'
import { asc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../../utils/admin'
import { parseProjectId, requireSignedIn } from '../../../utils/project-access'
import { assertThumbnailAllowed, deleteOwnedBlob } from '../../../utils/project-blob'

const MAX_IMAGES = 8

const gallerySchema = z.object({
	images: z.array(z.object({
		url: z.string().min(1, 'URL gambar wajib diisi'),
		alt: z.string().max(200, 'Deskripsi gambar maksimal 200 karakter').optional().nullable()
	})).max(MAX_IMAGES, `Galeri maksimal ${MAX_IMAGES} gambar`)
})

// Galeri diganti utuh sesuai urutan yang dikirim; gambar upload yang dilepas ikut dihapus dari R2.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const projectId = parseProjectId(event)

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, projectId)
	})
	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Proyek tidak ditemukan'
		})
	}
	if (project.userId !== String(session.user.id) && !isAdmin(session.user)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Kamu tidak punya akses untuk mengubah galeri ini'
		})
	}

	const body = await readBodyWith(event, gallerySchema)
	const current = await db
		.select()
		.from(schema.projectImages)
		.where(eq(schema.projectImages.projectId, projectId))
		.orderBy(asc(schema.projectImages.sortOrder))
	const currentUrls = new Set(current.map(image => image.url))

	for (const image of body.images) {
		assertThumbnailAllowed(image.url.trim(), project.userId, currentUrls.has(image.url) ? image.url : null)
	}

	const now = new Date()
	const inserts = body.images.map((image, index) => db.insert(schema.projectImages).values({
		projectId,
		url: image.url.trim(),
		alt: image.alt?.trim() || null,
		sortOrder: index,
		createdAt: now
	}))
	await db.batch([
		db.delete(schema.projectImages).where(eq(schema.projectImages.projectId, projectId)),
		...inserts
	])

	const keptUrls = new Set(body.images.map(image => image.url.trim()))
	for (const image of current) {
		if (!keptUrls.has(image.url) && image.url !== project.thumbnailUrl) {
			await deleteOwnedBlob(image.url, project.userId)
		}
	}

	return {
		success: true,
		images: body.images
	}
})
