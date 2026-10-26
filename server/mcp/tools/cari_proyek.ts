import { and, desc, eq, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineMcpTool } from '@nuxtjs/mcp-toolkit/server'
import { z } from 'zod'

const SITE = 'https://majalengka.tech'

export default defineMcpTool({
	name: 'cari_proyek',
	description: 'Mencari proyek (aplikasi, website, desain, tool) yang sudah diterbitkan kreator Majalengka di Majalengka Tech.',
	inputSchema: {
		kata: z.string().trim().max(60).optional().describe('Kata kunci di judul, tagline, atau teknologi, misalnya "UMKM" atau "Flutter"'),
		kategori: z.string().trim().max(40).optional().describe('Kategori proyek, misalnya "web", "mobile", "desain", "open-source"'),
		batas: z.number().int().min(1).max(20).optional().default(10).describe('Jumlah hasil, maksimal 20')
	},
	handler: async ({ kata, kategori, batas }) => {
		const { projects, user } = schema
		const likeCount = sql<number>`(select count(*) from project_likes pl where pl.project_id = ${projects.id})`
		const q = kata?.toLowerCase()
		const rows = await db
			.select({
				slug: projects.slug,
				title: projects.title,
				tagline: projects.tagline,
				category: projects.category,
				tags: projects.tags,
				demoUrl: projects.demoUrl,
				repoUrl: projects.repoUrl,
				createdAt: projects.createdAt,
				author: user.name,
				username: user.username,
				likeCount
			})
			.from(projects)
			.innerJoin(user, eq(projects.userId, user.id))
			.where(and(
				eq(projects.isPublished, true),
				sql`coalesce(${user.banned}, 0) = 0`,
				kategori ? eq(projects.category, kategori) : undefined,
				// instr supaya % dan _ dari kata kunci tidak dibaca sebagai wildcard LIKE.
				q ? sql`(instr(lower(${projects.title}), ${q}) > 0 or instr(lower(coalesce(${projects.tagline}, '')), ${q}) > 0 or instr(lower(coalesce(${projects.tags}, '')), ${q}) > 0)` : undefined
			))
			.orderBy(desc(projects.createdAt))
			.limit(batas)

		return {
			total: rows.length,
			proyek: rows.map(row => ({
				judul: row.title,
				tagline: row.tagline,
				kategori: row.category,
				teknologi: row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
				kreator: row.username ? `@${row.username}` : row.author,
				apresiasi: Number(row.likeCount) || 0,
				url: `${SITE}/projek/${row.slug}`,
				slug: row.slug,
				demo: row.demoUrl || undefined,
				repo: row.repoUrl || undefined,
				diterbitkan: row.createdAt
			}))
		}
	}
})
