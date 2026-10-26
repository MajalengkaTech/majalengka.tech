import { and, eq, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineMcpTool } from '@nuxtjs/mcp-toolkit/server'
import { z } from 'zod'

const SITE = 'https://majalengka.tech'

export default defineMcpTool({
	name: 'detail_proyek',
	description: 'Mengambil detail satu proyek di Majalengka Tech: cerita lengkap (Markdown), teknologi, peran kreator, dan tautan demo atau kode.',
	inputSchema: {
		slug: z.string().trim().min(1).max(120).describe('Slug proyek dari hasil cari_proyek, misalnya "offweb"')
	},
	handler: async ({ slug }) => {
		const { projects, user } = schema
		const [row] = await db
			.select({
				slug: projects.slug,
				title: projects.title,
				tagline: projects.tagline,
				description: projects.description,
				category: projects.category,
				contribution: projects.contribution,
				tags: projects.tags,
				demoUrl: projects.demoUrl,
				designUrl: projects.designUrl,
				repoUrl: projects.repoUrl,
				createdAt: projects.createdAt,
				updatedAt: projects.updatedAt,
				author: user.name,
				username: user.username
			})
			.from(projects)
			.innerJoin(user, eq(projects.userId, user.id))
			.where(and(eq(projects.slug, slug), eq(projects.isPublished, true), sql`coalesce(${user.banned}, 0) = 0`))
			.limit(1)

		if (!row) {
			return { ditemukan: false, pesan: `Proyek "${slug}" tidak ada atau belum diterbitkan. Cari slug yang benar dengan cari_proyek.` }
		}
		return {
			ditemukan: true,
			judul: row.title,
			tagline: row.tagline,
			kategori: row.category,
			peran: row.contribution,
			teknologi: row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
			cerita: row.description,
			kreator: row.username ? { nama: row.author, username: row.username, profil: `${SITE}/${row.username.toLowerCase()}` } : { nama: row.author },
			url: `${SITE}/projek/${row.slug}`,
			demo: row.demoUrl || undefined,
			desain: row.designUrl || undefined,
			repo: row.repoUrl || undefined,
			diterbitkan: row.createdAt,
			diperbarui: row.updatedAt ?? undefined
		}
	}
})
