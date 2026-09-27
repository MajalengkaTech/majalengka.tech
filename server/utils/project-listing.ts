import { sql } from 'drizzle-orm'
import { schema } from 'hub:db'

const { projects, user } = schema

// Hitungan pakai subquery per baris, bukan inArray(ids): D1 membatasi 100 parameter per query.
export function projectListColumns(currentUserId?: string | null) {
	const me = currentUserId || ''
	return {
		project: projects,
		author: {
			id: user.id,
			name: user.name,
			username: user.username,
			image: user.image,
			creatorRole: user.creatorRole,
			githubUsername: user.githubUsername
		},
		likeCount: sql<number>`(select count(*) from project_likes pl where pl.project_id = ${projects.id})`.as('like_count'),
		commentCount: sql<number>`(select count(*) from project_comments pc where pc.project_id = ${projects.id})`.as('comment_count'),
		likedByMe: sql<number>`exists(select 1 from project_likes pl where pl.project_id = ${projects.id} and pl.user_id = ${me})`.as('liked_by_me')
	}
}

type ProjectListRow = {
	project: typeof projects.$inferSelect
	author: {
		id: string | null
		name: string | null
		username: string | null
		image: string | null
		creatorRole: string | null
		githubUsername: string | null
	} | null
	likeCount: number
	commentCount: number
	likedByMe: number
}

export function toProjectItem(row: ProjectListRow) {
	return {
		...row.project,
		author: row.author?.id
			? {
					id: row.author.id,
					name: row.author.name || 'Kreator Majalengka',
					username: row.author.username,
					avatarUrl: row.author.image,
					creatorRole: row.author.creatorRole,
					githubUsername: row.author.githubUsername
				}
			: {
					id: row.project.userId,
					name: 'Kreator Majalengka',
					username: null,
					avatarUrl: null,
					creatorRole: null,
					githubUsername: null
				},
		likeCount: Number(row.likeCount) || 0,
		commentCount: Number(row.commentCount) || 0,
		likedByMe: Boolean(row.likedByMe)
	}
}
