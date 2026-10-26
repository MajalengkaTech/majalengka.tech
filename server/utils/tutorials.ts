import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from './admin'
import { getAuthSession } from './project-access'
import type { ServerEvent } from './validation'

export function slugifyTutorial(text: string) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
}

export async function uniqueTutorialSlug(title: string) {
	const base = slugifyTutorial(title) || 'tutorial'
	let slug = base
	for (let attempt = 0; attempt < 5; attempt++) {
		const [existing] = await db.select({ id: schema.tutorials.id }).from(schema.tutorials).where(eq(schema.tutorials.slug, slug)).limit(1)
		if (!existing) return slug
		slug = `${base}-${Math.random().toString(36).substring(2, 6)}`
	}
	return `${base}-${Date.now().toString(36)}`
}

export async function isTutorialReviewer(userId: string) {
	const [row] = await db.select({ userId: schema.tutorialReviewers.userId }).from(schema.tutorialReviewers).where(eq(schema.tutorialReviewers.userId, userId)).limit(1)
	return Boolean(row)
}

// Admin dan peninjau pilihan admin boleh meninjau; hak admin tetap dibaca dari kolom role.
export async function requireTutorialReviewer(event: ServerEvent) {
	const session = await getAuthSession(event)
	if (!session?.user?.id) {
		throw createError({ status: 401, statusText: 'Masuk dulu untuk meninjau tutorial.' })
	}
	const userId = String(session.user.id)
	if (!isAdmin(session.user) && !(await isTutorialReviewer(userId))) {
		throw createError({ status: 403, statusText: 'Halaman ini khusus peninjau tutorial.' })
	}
	return { session, userId, admin: isAdmin(session.user) }
}
