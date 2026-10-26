import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'

// Halaman dinamis untuk sitemap: tutorial dan proyek yang terbit, dan profil kreator yang punya minimal satu proyek terbit
// (profil kosong tidak dimasukkan supaya Google tidak mengindeks halaman tipis). Akun yang ditangguhkan tidak ikut.
export default defineSitemapEventHandler(async () => {
	const { projects, user } = schema
	const notBanned = sql`coalesce(${user.banned}, 0) = 0`

	const projectRows = await db
		.select({ slug: projects.slug, createdAt: projects.createdAt, updatedAt: projects.updatedAt })
		.from(projects)
		.innerJoin(user, eq(projects.userId, user.id))
		.where(and(eq(projects.isPublished, true), notBanned))

	const lastPublished = sql<number>`(select max(coalesce(p.updated_at, p.created_at)) from projects p where p.user_id = "user"."id" and p.is_published = 1)`
	const creatorRows = await db
		.select({ username: user.username, lastPublished: lastPublished.as('last_published') })
		.from(user)
		.where(and(isNotNull(user.username), notBanned, sql`${lastPublished} is not null`))

	const tutorialRows = await db
		.select({ slug: schema.tutorials.slug, publishedAt: schema.tutorials.publishedAt, updatedAt: schema.tutorials.updatedAt })
		.from(schema.tutorials)
		.innerJoin(user, eq(schema.tutorials.userId, user.id))
		.where(and(eq(schema.tutorials.status, 'terbit'), notBanned))

	return [
		...tutorialRows.map(row => ({
			loc: `/tutorial/${row.slug}`,
			lastmod: row.updatedAt ?? row.publishedAt ?? undefined
		})),
		...projectRows.map(row => ({
			loc: `/projek/${row.slug}`,
			lastmod: row.updatedAt ?? row.createdAt
		})),
		...creatorRows.map(row => ({
			loc: `/${String(row.username).toLowerCase()}`,
			lastmod: row.lastPublished ? new Date(Number(row.lastPublished) * 1000) : undefined
		}))
	]
})
