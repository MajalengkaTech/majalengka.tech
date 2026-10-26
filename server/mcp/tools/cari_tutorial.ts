import { and, desc, eq, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineMcpTool } from '@nuxtjs/mcp-toolkit/server'
import { z } from 'zod'

const SITE = 'https://majalengka.tech'

export default defineMcpTool({
	name: 'cari_tutorial',
	description: 'Mencari tutorial yang ditulis kreator Majalengka di Majalengka Tech, termasuk tutorial di balik pembuatan proyek mereka.',
	inputSchema: {
		kata: z.string().trim().max(60).optional().describe('Kata kunci di judul, ringkasan, atau teknologi, misalnya "Nuxt" atau "Figma"'),
		level: z.enum(['pemula', 'menengah', 'lanjut']).optional().describe('Tingkat kesulitan'),
		batas: z.number().int().min(1).max(20).optional().default(10).describe('Jumlah hasil, maksimal 20')
	},
	handler: async ({ kata, level, batas }) => {
		const { tutorials, user, projects } = schema
		const q = kata?.toLowerCase()
		const rows = await db
			.select({
				slug: tutorials.slug,
				title: tutorials.title,
				summary: tutorials.summary,
				level: tutorials.level,
				tags: tutorials.tags,
				publishedAt: tutorials.publishedAt,
				author: user.name,
				username: user.username,
				projectSlug: projects.slug
			})
			.from(tutorials)
			.innerJoin(user, eq(tutorials.userId, user.id))
			.leftJoin(projects, and(eq(tutorials.projectId, projects.id), eq(projects.isPublished, true)))
			.where(and(
				eq(tutorials.status, 'terbit'),
				sql`coalesce(${user.banned}, 0) = 0`,
				level ? eq(tutorials.level, level) : undefined,
				q ? sql`(instr(lower(${tutorials.title}), ${q}) > 0 or instr(lower(coalesce(${tutorials.summary}, '')), ${q}) > 0 or instr(lower(coalesce(${tutorials.tags}, '')), ${q}) > 0)` : undefined
			))
			.orderBy(desc(tutorials.publishedAt))
			.limit(batas)

		return {
			total: rows.length,
			tutorial: rows.map(row => ({
				judul: row.title,
				ringkasan: row.summary || undefined,
				level: row.level,
				teknologi: row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
				penulis: row.username ? `@${row.username}` : row.author,
				url: `${SITE}/tutorial/${row.slug}`,
				markdown: `${SITE}/tutorial/${row.slug}.md`,
				proyekTerkait: row.projectSlug ? `${SITE}/projek/${row.projectSlug}` : undefined,
				terbit: row.publishedAt
			}))
		}
	}
})
