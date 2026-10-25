import type { schema } from 'hub:db'
import type { SocialLinkItem } from '~~/shared/utils/profile-schema'

type UserRecord = typeof schema.user.$inferSelect

export function parseSocialLinks(raw: string | null | undefined): SocialLinkItem[] {
	if (!raw) return []
	try {
		const parsed = JSON.parse(raw)
		if (Array.isArray(parsed)) {
			return parsed.filter(item => item && typeof item === 'object' && item.url)
		}
	} catch {
		return []
	}
	return []
}

export function toPrivateProfile(user: UserRecord) {
	const userWithSocial = user as UserRecord & { socialLinks?: string | null }
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
		socialLinks: parseSocialLinks(userWithSocial.socialLinks),
		role: user.role || 'user',
		createdAt: user.createdAt
	}
}
