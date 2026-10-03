import { count, countDistinct, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

// Angka untuk beranda dan filter Showcase; semuanya dihitung dari proyek yang sudah terbit.
export default defineEventHandler(async () => {
	const published = eq(schema.projects.isPublished, true)

	const [categories, [totals]] = await Promise.all([
		db.select({ category: schema.projects.category, total: count() })
			.from(schema.projects)
			.where(published)
			.groupBy(schema.projects.category),
		db.select({ projects: count(), creators: countDistinct(schema.projects.userId) })
			.from(schema.projects)
			.where(published)
	])

	return {
		totalProjects: totals?.projects ?? 0,
		totalCreators: totals?.creators ?? 0,
		categories: Object.fromEntries(categories.map(row => [row.category, row.total])) as Partial<Record<ProjectCategory, number>>
	}
})
