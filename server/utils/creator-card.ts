import { Resvg } from '@resvg/resvg-js'
import { CREATOR_ROLES, type CreatorRole } from '../../shared/utils/profile-schema'

export interface CreatorCardRenderData {
	name: string
	username: string
	avatarUrl?: string | null
	role?: string | null
	projectCount: number
	likeCount: number
	rank: number
	totalCreators: number
}

function escapeXml(unsafe: string): string {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case '<': return '&lt;'
			case '>': return '&gt;'
			case '&': return '&amp;'
			case '\'': return '&apos;'
			case '"': return '&quot;'
			default: return c
		}
	})
}

function getInitials(name: string): string {
	const clean = name.replace(/^@/, '').trim()
	return clean.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('') || 'MT'
}

export async function fetchAvatarDataUri(url: string | null | undefined): Promise<string | null> {
	if (!url) return null
	try {
		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), 2500)
		const response = await fetch(url, { signal: controller.signal })
		clearTimeout(timer)
		if (!response.ok) return null
		const arrayBuffer = await response.arrayBuffer()
		const mime = response.headers.get('content-type') || 'image/png'
		const base64 = Buffer.from(arrayBuffer).toString('base64')
		return `data:${mime};base64,${base64}`
	} catch {
		return null
	}
}

export async function generateCreatorCardSvg(data: CreatorCardRenderData): Promise<string> {
	const roleText = data.role ? (CREATOR_ROLES[data.role as CreatorRole] || data.role) : null
	const avatarDataUri = await fetchAvatarDataUri(data.avatarUrl)
	const initials = getInitials(data.name || data.username)

	const rankText = data.totalCreators > 0 && data.projectCount > 0
		? `<text x="600" y="440" fill="#FFFFFF" font-size="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
				Peringkat apresiasi <tspan font-weight="700" fill="#FEB33B">#${data.rank}</tspan> dari ${data.totalCreators} kreator
			</text>`
		: ''

	const avatarElement = avatarDataUri
		? `<image href="${avatarDataUri}" x="64" y="150" width="176" height="176" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-clip)" />`
		: `<text x="152" y="260" fill="#FFFFFF" font-size="64" font-weight="700" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${escapeXml(initials)}</text>`

	return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#000033" />
			<stop offset="100%" stop-color="#000022" />
		</linearGradient>
		<clipPath id="avatar-clip">
			<circle cx="152" cy="238" r="88" />
		</clipPath>
	</defs>

	<!-- Background -->
	<rect width="1200" height="630" fill="url(#card-bg)" />

	<!-- Brand Header -->
	<g transform="translate(64, 52)">
		<circle cx="22" cy="22" r="22" fill="#6293FF" />
		<path d="M12 22 C16 14, 20 14, 24 22 C28 30, 32 30, 36 22" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
		<text x="58" y="30" fill="#FFFFFF" font-size="28" font-weight="700" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">majalengka.tech</text>
	</g>

	<!-- Avatar Container -->
	<circle cx="152" cy="238" r="88" fill="#0014A8" stroke="#00017B" stroke-width="6" />
	${avatarElement}
	<circle cx="152" cy="238" r="88" fill="none" stroke="#00017B" stroke-width="6" />

	<!-- Creator Details -->
	<text x="64" y="396" fill="#FFFFFF" font-size="46" font-weight="700" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">@${escapeXml(data.username)}</text>
	${roleText ? `<text x="64" y="440" fill="#99BAFE" font-size="26" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${escapeXml(roleText)}</text>` : ''}

	<!-- Stats Tile 1: Proyek -->
	<g transform="translate(600, 140)">
		<rect width="256" height="230" rx="24" fill="#00004A" stroke="#00017B" stroke-width="3" />
		<text x="28" y="140" fill="#FFFFFF" font-size="96" font-weight="700" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${data.projectCount}</text>
		<text x="28" y="196" fill="#99BAFE" font-size="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Proyek terbit</text>
	</g>

	<!-- Stats Tile 2: Apresiasi -->
	<g transform="translate(880, 140)">
		<rect width="256" height="230" rx="24" fill="#00004A" stroke="#00017B" stroke-width="3" />
		<text x="28" y="140" fill="#FEB33B" font-size="96" font-weight="700" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${data.likeCount}</text>
		<text x="28" y="196" fill="#99BAFE" font-size="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Apresiasi diterima</text>
	</g>

	<!-- Rank Info -->
	${rankText}

	<!-- Footer -->
	<text x="64" y="566" fill="#6293FF" font-size="26" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">majalengka.tech/@${escapeXml(data.username)}</text>
	<text x="1136" y="566" fill="#99BAFE" font-size="22" text-anchor="end" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Komunitas Developer &amp; Desainer Majalengka</text>
</svg>`
}

export async function generateCreatorCardPng(data: CreatorCardRenderData): Promise<Buffer> {
	const svg = await generateCreatorCardSvg(data)
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: 1200 },
		font: { loadSystemFonts: true }
	})
	return Buffer.from(resvg.render().asPng())
}
