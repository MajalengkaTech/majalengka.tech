import type { CreatorCardData } from '~/types/project'

const WIDTH = 1200
const HEIGHT = 630
const COLORS = {
	background: '#000033',
	tile: '#00004A',
	tileBorder: '#00017B',
	text: '#FFFFFF',
	muted: '#99BAFE',
	link: '#6293FF',
	accent: '#FEB33B',
	avatar: '#0014A8'
}
const HEADING_FONT = '"Bricolage Grotesque", sans-serif'
const BODY_FONT = '"TikTok Sans", sans-serif'

function loadImage(src: string, crossOrigin = true) {
	return new Promise<HTMLImageElement | null>((resolve) => {
		const image = new Image()
		// Tanpa CORS dari server avatar, gambar gagal dimuat dan kartu memakai inisial; canvas tidak pernah tercemar.
		if (crossOrigin) image.crossOrigin = 'anonymous'
		image.onload = () => resolve(image)
		image.onerror = () => resolve(null)
		image.src = src
	})
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath()
	ctx.roundRect(x, y, w, h, r)
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
	if (ctx.measureText(text).width <= maxWidth) return text
	let cut = text
	while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
	return `${cut}…`
}

function initials(name: string) {
	return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('')
}

async function drawCard(data: CreatorCardData) {
	await Promise.all([
		document.fonts.load(`700 96px ${HEADING_FONT}`),
		document.fonts.load(`400 28px ${BODY_FONT}`),
		document.fonts.load(`700 28px ${BODY_FONT}`)
	]).catch(() => {})

	const canvas = document.createElement('canvas')
	canvas.width = WIDTH
	canvas.height = HEIGHT
	const ctx = canvas.getContext('2d')!

	ctx.fillStyle = COLORS.background
	ctx.fillRect(0, 0, WIDTH, HEIGHT)

	const logo = await loadImage('/logo-circle.svg', false)
	if (logo) ctx.drawImage(logo, 64, 52, 44, 44)
	ctx.fillStyle = COLORS.text
	ctx.font = `700 28px ${BODY_FONT}`
	ctx.textBaseline = 'middle'
	ctx.fillText('majalengka.tech', 122, 75)

	const avatarSize = 176
	const avatarX = 64
	const avatarY = 150
	ctx.save()
	ctx.beginPath()
	ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
	ctx.closePath()
	ctx.clip()
	const avatar = data.avatarUrl ? await loadImage(data.avatarUrl) : null
	if (avatar) {
		ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
	} else {
		ctx.fillStyle = COLORS.avatar
		ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)
		ctx.fillStyle = COLORS.text
		ctx.font = `700 64px ${HEADING_FONT}`
		ctx.textAlign = 'center'
		ctx.fillText(initials(data.name), avatarX + avatarSize / 2, avatarY + avatarSize / 2)
		ctx.textAlign = 'left'
	}
	ctx.restore()
	ctx.lineWidth = 8
	ctx.strokeStyle = COLORS.tileBorder
	ctx.beginPath()
	ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
	ctx.stroke()

	ctx.textBaseline = 'alphabetic'
	ctx.fillStyle = COLORS.text
	ctx.font = `700 46px ${HEADING_FONT}`
	ctx.fillText(fitText(ctx, data.name, 470), 64, 400)
	ctx.fillStyle = COLORS.muted
	ctx.font = `400 26px ${BODY_FONT}`
	const handle = data.roleLabel ? `@${data.username} · ${data.roleLabel}` : `@${data.username}`
	ctx.fillText(fitText(ctx, handle, 470), 64, 444)

	const tiles = [
		{ value: data.projectCount, label: 'Karya terbit', color: COLORS.text },
		{ value: data.likeCount, label: 'Apresiasi diterima', color: COLORS.accent }
	]
	tiles.forEach((tile, index) => {
		const x = 600 + index * 280
		const y = 140
		roundedRect(ctx, x, y, 256, 230, 24)
		ctx.fillStyle = COLORS.tile
		ctx.fill()
		ctx.lineWidth = 3
		ctx.strokeStyle = COLORS.tileBorder
		ctx.stroke()
		ctx.fillStyle = tile.color
		ctx.font = `700 104px ${HEADING_FONT}`
		ctx.fillText(String(tile.value), x + 28, y + 140)
		ctx.fillStyle = COLORS.muted
		ctx.font = `400 26px ${BODY_FONT}`
		ctx.fillText(tile.label, x + 28, y + 196)
	})

	if (data.totalCreators > 0 && data.projectCount > 0) {
		ctx.fillStyle = COLORS.text
		ctx.font = `400 30px ${BODY_FONT}`
		const prefix = 'Peringkat apresiasi '
		ctx.fillText(prefix, 600, 440)
		const prefixWidth = ctx.measureText(prefix).width
		ctx.font = `700 30px ${BODY_FONT}`
		const rank = `#${data.rank}`
		ctx.fillText(rank, 600 + prefixWidth, 440)
		const rankWidth = ctx.measureText(rank).width
		ctx.font = `400 30px ${BODY_FONT}`
		ctx.fillText(` dari ${data.totalCreators} kreator`, 600 + prefixWidth + rankWidth, 440)
	}

	ctx.fillStyle = COLORS.link
	ctx.font = `400 26px ${BODY_FONT}`
	ctx.fillText(`majalengka.tech/${data.username}`, 64, 566)
	ctx.fillStyle = COLORS.muted
	ctx.textAlign = 'right'
	ctx.fillText(`Data per ${formatTanggal(new Date())}`, WIDTH - 64, 566)
	ctx.textAlign = 'left'

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Kartu gagal dibuat')), 'image/png')
	})
}

export function useCreatorCard() {
	const busy = ref(false)

	async function downloadCard(data: CreatorCardData) {
		busy.value = true
		try {
			const blob = await drawCard(data)
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `kartu-${data.username}-majalengka-tech.png`
			link.click()
			URL.revokeObjectURL(url)
		} finally {
			busy.value = false
		}
	}

	async function uploadCard(data: CreatorCardData) {
		const blob = await drawCard(data)
		const form = new FormData()
		form.append('card', blob, 'kartu.png')
		return $fetch<{ url: string }>('/api/user/card', { method: 'POST', body: form })
	}

	return { busy, downloadCard, uploadCard }
}
