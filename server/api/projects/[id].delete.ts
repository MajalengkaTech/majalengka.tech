import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { SUPER_ADMIN_EMAIL } from '../../utils/admin'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		})
	}

	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, Number(id))
	})

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Projek tidak ditemukan'
		})
	}

	const role = (session.user as { role?: string })?.role
	const email = session.user.email?.toLowerCase()
	const isAdmin = role === 'admin' || email === SUPER_ADMIN_EMAIL.toLowerCase()

	// Verify ownership or admin role
	if (project.userId !== session.user.id && !isAdmin) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Anda tidak memiliki hak akses untuk menghapus projek ini'
		})
	}

	// Hapus file thumbnail dari Cloudflare R2 jika file disimpan di R2 lokal/internal
	if (project.thumbnailUrl) {
		try {
			const pathname = project.thumbnailUrl.startsWith('/api/files/')
				? project.thumbnailUrl.replace('/api/files/', '')
				: project.thumbnailUrl

			// Pastikan bukan URL eksternal (http:// atau https://)
			if (pathname && !/^https?:\/\//i.test(pathname)) {
				await blob.delete(pathname)
			}
		} catch (error) {
			console.warn('[Blob] Gagal menghapus file thumbnail dari R2:', error)
		}
	}

	await db.delete(schema.projects).where(eq(schema.projects.id, Number(id)))

	return {
		success: true,
		message: 'Projek berhasil dihapus'
	}
})
