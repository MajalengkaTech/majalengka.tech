export interface ProjectAuthor {
	id: string | number
	name: string
	username?: string | null
	avatarUrl?: string | null
	creatorRole?: string | null
	githubUsername?: string | null
}

export interface ProjectImage {
	id?: number
	url: string
	alt?: string | null
}

export interface ProjectItem {
	id: number
	userId: string | number
	title: string
	slug: string
	tagline?: string | null
	description: string
	category?: string
	contribution?: string | null
	thumbnailUrl?: string | null
	repoUrl?: string | null
	demoUrl?: string | null
	designUrl?: string | null
	tags?: string | null
	isPublished?: boolean
	isFeatured?: boolean
	featuredAt?: string | Date | null
	createdAt: string | Date
	updatedAt?: string | Date | null
	author?: ProjectAuthor
	likeCount?: number
	likedByMe?: boolean
	commentCount?: number
	averageRating?: number
	reviewCount?: number
	currentUserRating?: number | null
}

export interface ProjectDetail extends ProjectItem {
	images: ProjectImage[]
	isOwner: boolean
	author: ProjectAuthor & {
		bio?: string | null
		location?: string | null
		openToWork?: boolean | null
		websiteUrl?: string | null
		designUrl?: string | null
		linkedinUrl?: string | null
	}
}

export interface ProjectComment {
	id: number
	body: string
	createdAt: string | Date
	updatedAt?: string | Date | null
	author: {
		id: string | null
		name: string
		username?: string | null
		avatarUrl?: string | null
	}
}

export interface CreatorProfile {
	id: string
	name: string
	username: string | null
	avatarUrl: string | null
	bio: string | null
	creatorRole: string | null
	location: string | null
	skills: string | null
	openToWork: boolean | null
	githubUsername: string | null
	websiteUrl: string | null
	designUrl: string | null
	linkedinUrl: string | null
	createdAt: string | Date
	projectCount: number
	likeCount: number
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
