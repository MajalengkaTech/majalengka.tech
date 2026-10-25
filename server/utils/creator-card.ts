import { Resvg } from '@resvg/resvg-js'
import { creatorRoleLabel } from '../../shared/utils/profile-schema'

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

// URL avatar diisi pengguna, jadi server hanya mengambil dari host foto profil yang dikenal. Tanpa batas ini
// kartu bisa dipakai membaca alamat internal server (isinya ikut tampil di SVG sebagai base64).
const AVATAR_HOSTS = ['res.cloudinary.com', 'avatars.githubusercontent.com', 'lh3.googleusercontent.com']
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export async function fetchAvatarDataUri(url: string | null | undefined): Promise<string | null> {
	if (!url) return null
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return null
	}
	if (parsed.protocol !== 'https:' || !AVATAR_HOSTS.includes(parsed.hostname)) return null

	try {
		// redirect: 'error' supaya host yang diizinkan tidak bisa mengalihkan ke alamat lain.
		const response = await fetch(parsed, { signal: AbortSignal.timeout(2500), redirect: 'error' })
		if (!response.ok) return null
		// Tipe diambil dari daftar tetap, bukan dari header mentah, karena nilainya ditulis ke atribut SVG.
		const mime = AVATAR_TYPES.find(type => response.headers.get('content-type')?.toLowerCase().startsWith(type))
		if (!mime || Number(response.headers.get('content-length') || 0) > AVATAR_MAX_BYTES) return null
		const data = Buffer.from(await response.arrayBuffer())
		if (data.length > AVATAR_MAX_BYTES) return null
		return `data:${mime};base64,${data.toString('base64')}`
	} catch {
		return null
	}
}

export async function generateCreatorCardSvg(data: CreatorCardRenderData): Promise<string> {
	const roleText = creatorRoleLabel(data.role)
	const avatarDataUri = await fetchAvatarDataUri(data.avatarUrl)
	const initials = getInitials(data.name || data.username)

	const rankText = data.totalCreators > 0 && data.projectCount > 0
		? `<text x="600" y="440" fill="#FFFFFF" font-size="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
				Peringkat apresiasi <tspan font-weight="700" fill="#FEB33B">#${data.rank}</tspan> dari ${data.totalCreators} kreator
			</text>`
		: ''

	const avatarElement = avatarDataUri
		? `<image href="${escapeXml(avatarDataUri)}" x="64" y="150" width="176" height="176" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-clip)" />`
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
		<g transform="scale(0.088)">
			<path d="M459.1 0H40.9C18.3116 0 0 18.3116 0 40.9V459.1C0 481.688 18.3116 500 40.9 500H459.1C481.688 500 500 481.688 500 459.1V40.9C500 18.3116 481.688 0 459.1 0Z" fill="#0014A8" />
			<path d="M429.02 264.66C433.37 311.33 396.71 348.17 351.91 352.82C254.17 366.72 176.56 223.1 83.45 301.99C97.31 262.92 141.39 246.87 180.01 253.39C267.8 274.73 349.4 364.98 429.02 264.65V264.66Z" fill="#FCFCFB" />
			<path d="M340.13 384.82C335.25 399.12 319.98 409.43 305.65 412.78C279.92 418.79 256.09 407.92 236.35 392.29C216.81 376.81 193.82 346.07 165.78 350.52C151.3 352.82 140.06 366.68 142.9 381.48C146.74 401.5 171.32 407.49 185.47 393.83C184.99 402.55 177.28 410.52 169.6 414.01C146.71 424.41 120.33 408.29 113.73 385.33C104.99 354.92 125.48 327.76 155.92 323.9C202.17 318.04 233.07 360.66 270.61 379.02C292.17 389.57 317.19 393.58 340.12 384.81L340.13 384.82Z" fill="#FCFCFB" />
			<path d="M52.16 254.93C61.07 194.79 117.91 163.79 172.7 170.05C233.53 177 286.91 236.45 346.61 227.06C408.35 217.34 406.17 130.62 348.53 126.28C318.01 123.98 289.54 152.9 300.44 185.09C302 189.7 305.03 193.47 307.25 197.67C269.97 180.17 275.61 131.09 302.22 105.64C344.95 64.77 415.84 83.36 439.76 136.94C467.52 199.12 425.93 264.31 363.78 273.93C280.75 286.78 232.71 220.04 157.34 210.08C129.72 206.43 100.61 210.78 77.32 227.35C66.88 234.78 59.2 244.12 52.15 254.94L52.16 254.93Z" fill="#FCFCFB" />
		</g>
		<text x="60" y="32" fill="#FFFFFF" font-size="28" font-weight="700" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">majalengka.tech</text>
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
		font: {
			loadSystemFonts: true,
			defaultFontFamily: 'DejaVu Sans'
		}
	})
	return Buffer.from(resvg.render().asPng())
}
