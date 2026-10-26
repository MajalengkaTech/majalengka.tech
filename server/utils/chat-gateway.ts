import type { H3Event } from 'h3'
import { getAuthSession } from './project-access'

// Header untuk gateway chat Maja. Gateway hanya mempercayai IP dan ID akun bila secret cocok, jadi kuota
// (10 pertanyaan per hari tanpa login, 50 untuk kreator yang masuk) tidak bisa dipalsukan dari browser.
// Yang dikirim hanya ID akun, tidak pernah email atau data profil lain.
export async function chatGatewayHeaders(event: H3Event) {
	const { chatProxySecret } = useRuntimeConfig(event)
	const headers: Record<string, string> = {}
	if (!chatProxySecret) return headers
	const clientIp = getRequestHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || ''
	if (clientIp) {
		headers['X-Proxy-Secret'] = chatProxySecret
		headers['X-Client-IP'] = clientIp
	}
	const session = await getAuthSession(event).catch(() => null)
	const userId = session?.user?.id ? String(session.user.id) : ''
	if (userId && !(session?.user as { banned?: boolean } | undefined)?.banned) {
		headers['X-Proxy-Secret'] = chatProxySecret
		headers['X-User-Id'] = userId
	}
	return headers
}

export function chatGatewayUrl(event: H3Event, path: string) {
	return `${useRuntimeConfig(event).chatGatewayUrl.replace(/\/+$/, '')}${path}`
}
