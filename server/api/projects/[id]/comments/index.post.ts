import { db, schema } from 'hub:db'
import { parseProjectId, requirePublishedProject, requireSignedIn } from '../../../../utils/project-access'

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event, 'Masuk dulu untuk menulis komentar')
	const projectId = parseProjectId(event)
	await requirePublishedProject(projectId)

	const body = await readBodyWith(event, projectCommentSchema)
	const now = new Date()

	const [comment] = await db.insert(schema.projectComments).values({
		projectId,
		userId: String(session.user.id),
		body: body.body,
		createdAt: now,
		updatedAt: now
	}).returning()

	return {
		success: true,
		comment
	}
})
