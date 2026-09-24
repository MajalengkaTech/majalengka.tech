export interface ProjectItem {
	id: number
	userId: string | number
	title: string
	slug: string
	description: string
	thumbnailUrl?: string | null
	repoUrl?: string | null
	demoUrl?: string | null
	tags?: string | null
	isPublished?: boolean
	createdAt: string | Date
	updatedAt?: string | Date | null
	author?: {
		id: string | number
		name: string
		avatarUrl?: string | null
		githubUsername?: string | null
	}
	averageRating?: number
	reviewCount?: number
	currentUserRating?: number | null
}

export interface ProjectReviewItem {
	id: number
	projectId: number
	userId: string
	rating: number
	comment?: string | null
	createdAt: string | Date
	updatedAt?: string | Date | null
	author?: {
		id: string
		name: string
		avatarUrl?: string | null
		role?: string | null
	}
}

export interface ProjectReviewSummary {
	averageRating: number
	totalReviews: number
	distribution: Record<number, number>
}
