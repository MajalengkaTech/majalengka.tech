import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineMcpTool } from '@nuxtjs/mcp-toolkit/server'
import { z } from 'zod'

const SITE = 'https://majalengka.tech'

export default defineMcpTool({
	name: 'cari_kreator',
	description: 'Mencari kreator (developer dan desainer) Majalengka berdasarkan skill, lokasi atau kampus, dan kesediaan diajak kerja sama.',
	inputSchema: {
		skill: z.string().trim().max(40).optional().describe('Skill yang dicari, misalnya "Figma", "Laravel", atau "Flutter"'),
		lokasi: z.string().trim().max(60).optional().describe('Lokasi atau kampus, misalnya "Talaga" atau "UNMA"'),
		terbuka: z.boolean().optional().describe('true untuk kreator yang menandai diri terbuka untuk kerja sama'),
		batas: z.number().int().min(1).max(20).optional().default(10).describe('Jumlah hasil, maksimal 20')
	},
	handler: async ({ skill, lokasi, terbuka, batas }) => {
		const { user } = schema
		// Kolom user ditulis lengkap di subquery; query satu tabel membuat drizzle menulis "id" polos.
		const projectCount = sql<number>`(select count(*) from projects p where p.user_id = "user"."id" and p.is_published = 1)`
		const lastPublished = sql<number>`(select max(p.created_at) from projects p where p.user_id = "user"."id" and p.is_published = 1)`
		const rows = await db
			.select({
				username: user.username,
				name: user.name,
				creatorRole: user.creatorRole,
				location: user.location,
				skills: user.skills,
				bio: user.bio,
				openToWork: user.openToWork,
				projectCount: projectCount.as('project_count')
			})
			.from(user)
			.where(and(
				isNotNull(user.username),
				sql`coalesce(${user.banned}, 0) = 0`,
				sql`${projectCount} > 0`,
				terbuka ? eq(user.openToWork, true) : undefined,
				skill ? sql`instr(lower(coalesce(${user.skills}, '')), ${skill.toLowerCase()}) > 0` : undefined,
				lokasi ? sql`instr(lower(coalesce(${user.location}, '')), ${lokasi.toLowerCase()}) > 0` : undefined
			))
			.orderBy(desc(lastPublished))
			.limit(batas)

		return {
			total: rows.length,
			kreator: rows.map(row => ({
				username: `@${row.username}`,
				nama: row.name,
				peran: row.creatorRole || undefined,
				lokasi: row.location || undefined,
				skill: row.skills ? row.skills.split(',').map(item => item.trim()).filter(Boolean) : [],
				bio: row.bio || undefined,
				terbukaKerjaSama: Boolean(row.openToWork),
				jumlahProyek: Number(row.projectCount) || 0,
				profil: `${SITE}/${String(row.username).toLowerCase()}`
			}))
		}
	}
})
