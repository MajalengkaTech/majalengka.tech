import type { schema } from 'hub:db'

type UserRecord = typeof schema.user.$inferSelect

export function toPrivateProfile(user: UserRecord) {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		avatarUrl: user.image,
		username: user.username || null,
		bio: user.bio || null,
		creatorRole: user.creatorRole || null,
		location: user.location || null,
		skills: user.skills || null,
		openToWork: Boolean(user.openToWork),
		githubUsername: user.githubUsername || null,
		websiteUrl: user.websiteUrl || null,
		designUrl: user.designUrl || null,
		linkedinUrl: user.linkedinUrl || null,
		role: user.role || 'user',
		createdAt: user.createdAt
	}
}
