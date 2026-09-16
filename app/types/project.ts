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
}
