import { sql } from 'drizzle-orm'
import { db } from 'hub:db'

export interface CreatorStats {
	projectCount: number
	likeCount: number
	rank: number
	totalCreators: number
}

// Peringkat dihitung dari kreator yang punya username dan minimal satu karya terbit, berdasarkan total apresiasi diterima.
export async function getCreatorStats(userId: string): Promise<CreatorStats> {
	const row = await db.get<{ projectCount: number, likeCount: number, rank: number, totalCreators: number }>(sql`
		with creators as (
			select u.id,
				(select count(*) from projects p where p.user_id = u.id and p.is_published = 1) as project_count,
				(select count(*) from project_likes pl join projects p on p.id = pl.project_id
					where p.user_id = u.id and p.is_published = 1) as like_count
			from "user" u
			where u.username is not null and coalesce(u.banned, 0) = 0
		),
		ranked as (select * from creators where project_count > 0),
		me as (
			select
				(select count(*) from projects p where p.user_id = ${userId} and p.is_published = 1) as project_count,
				(select count(*) from project_likes pl join projects p on p.id = pl.project_id
					where p.user_id = ${userId} and p.is_published = 1) as like_count
		)
		select
			me.project_count as projectCount,
			me.like_count as likeCount,
			(select count(*) from ranked where ranked.like_count > me.like_count) + 1 as rank,
			(select count(*) from ranked) as totalCreators
		from me
	`)

	const projectCount = Number(row?.projectCount) || 0
	return {
		projectCount,
		likeCount: Number(row?.likeCount) || 0,
		// Kreator tanpa karya terbit tidak ikut diperingkat.
		rank: projectCount > 0 ? Number(row?.rank) || 1 : 0,
		totalCreators: Number(row?.totalCreators) || 0
	}
}

export function creatorCardPath(userId: string) {
	return `Kartu/${userId}.png`
}
