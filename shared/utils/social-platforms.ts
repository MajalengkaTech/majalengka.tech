export interface SocialPlatformConfig {
	id: string
	label: string
	icon: string
	placeholder: string
	prefix?: string
	matchPattern?: RegExp
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
	{
		id: 'website',
		label: 'Website / Portofolio',
		icon: 'i-mage-globe',
		placeholder: 'https://...',
		matchPattern: /^https?:\/\//i
	},
	{
		id: 'github',
		label: 'GitHub',
		icon: 'i-mage-github',
		placeholder: 'https://github.com/... atau username',
		matchPattern: /github\.com/i
	},
	{
		id: 'x',
		label: 'X (Twitter)',
		icon: 'i-mage-x-square',
		placeholder: 'https://x.com/...',
		matchPattern: /(?:x\.com|twitter\.com)/i
	},
	{
		id: 'instagram',
		label: 'Instagram',
		icon: 'i-mage-instagram-square',
		placeholder: 'https://instagram.com/...',
		matchPattern: /instagram\.com/i
	},
	{
		id: 'linkedin',
		label: 'LinkedIn',
		icon: 'i-mage-linkedin',
		placeholder: 'https://linkedin.com/in/...',
		matchPattern: /linkedin\.com/i
	},
	{
		id: 'dribbble',
		label: 'Dribbble',
		icon: 'i-mage-dribbble',
		placeholder: 'https://dribbble.com/...',
		matchPattern: /dribbble\.com/i
	},
	{
		id: 'behance',
		label: 'Behance',
		icon: 'i-mage-behance',
		placeholder: 'https://behance.net/...',
		matchPattern: /behance\.net/i
	},
	{
		id: 'youtube',
		label: 'YouTube',
		icon: 'i-mage-youtube',
		placeholder: 'https://youtube.com/@...',
		matchPattern: /(?:youtube\.com|youtu\.be)/i
	},
	{
		id: 'tiktok',
		label: 'TikTok',
		icon: 'i-mage-tiktok',
		placeholder: 'https://tiktok.com/@...',
		matchPattern: /tiktok\.com/i
	},
	{
		id: 'discord',
		label: 'Discord',
		icon: 'i-mage-discord',
		placeholder: 'https://discord.gg/...',
		matchPattern: /(?:discord\.gg|discord\.com)/i
	},
	{
		id: 'telegram',
		label: 'Telegram',
		icon: 'i-mage-telegram',
		placeholder: 'https://t.me/...',
		matchPattern: /(?:t\.me|telegram\.me)/i
	},
	{
		id: 'facebook',
		label: 'Facebook',
		icon: 'i-mage-facebook-square',
		placeholder: 'https://facebook.com/...',
		matchPattern: /facebook\.com/i
	},
	{
		id: 'threads',
		label: 'Threads',
		icon: 'i-mage-threads-square',
		placeholder: 'https://threads.net/@...',
		matchPattern: /threads\.net/i
	},
	{
		id: 'medium',
		label: 'Medium',
		icon: 'i-mage-medium',
		placeholder: 'https://medium.com/@...',
		matchPattern: /medium\.com/i
	},
	{
		id: 'figma',
		label: 'Figma',
		icon: 'i-mage-figma',
		placeholder: 'https://figma.com/@...',
		matchPattern: /figma\.com/i
	},
	{
		id: 'custom',
		label: 'Tautan Kustom',
		icon: 'i-mage-link',
		placeholder: 'https://...'
	}
]

export function getSocialPlatformConfig(platformId?: string): SocialPlatformConfig {
	if (!platformId) return SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]!
	return SOCIAL_PLATFORMS.find(p => p.id === platformId) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]!
}

export function detectSocialPlatform(url: string, currentPlatform = 'custom'): SocialPlatformConfig {
	if (!url) return getSocialPlatformConfig(currentPlatform)
	for (const platform of SOCIAL_PLATFORMS) {
		if (platform.id !== 'custom' && platform.id !== 'website' && platform.matchPattern?.test(url)) {
			return platform
		}
	}
	return getSocialPlatformConfig(currentPlatform)
}

export function normalizeSocialUrl(url: string, platformId?: string): string {
	const trimmed = url.trim()
	if (!trimmed) return ''
	if (/^https?:\/\//i.test(trimmed)) return trimmed
	if (platformId === 'github') return `https://github.com/${trimmed.replace(/^@/, '')}`
	if (platformId === 'x') return `https://x.com/${trimmed.replace(/^@/, '')}`
	if (platformId === 'instagram') return `https://instagram.com/${trimmed.replace(/^@/, '')}`
	if (platformId === 'telegram') return `https://t.me/${trimmed.replace(/^@/, '')}`
	if (platformId === 'threads') return `https://threads.net/@${trimmed.replace(/^@/, '')}`
	if (platformId === 'tiktok') return `https://tiktok.com/@${trimmed.replace(/^@/, '')}`
	if (platformId === 'medium') return `https://medium.com/@${trimmed.replace(/^@/, '')}`
	return `https://${trimmed}`
}
