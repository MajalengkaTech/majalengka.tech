import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireAdminSession } from '../../../../utils/admin'
import { parseProjectId, requirePublishedProject } from '../../../../utils/project-access'

const featureSchema = z.object({
	featured: z.boolean()
})

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)
	const projectId = parseProjectId(event)
	await requirePublishedProject(projectId)
	const body = await readBodyWith(event, featureSchema)

	const [updated] = await db.update(schema.projects).set({
		isFeatured: body.featured,
		featuredAt: body.featured ? new Date() : null
	}).where(eq(schema.projects.id, projectId)).returning({
		id: schema.projects.id,
		isFeatured: schema.projects.isFeatured,
		featuredAt: schema.projects.featuredAt
	})

	return {
		success: true,
		project: updated,
		message: body.featured ? 'Proyek masuk Pilihan Kurator' : 'Proyek dikeluarkan dari Pilihan Kurator'
	}
})
