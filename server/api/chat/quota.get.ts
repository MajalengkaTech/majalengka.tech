import { chatGatewayHeaders, chatGatewayUrl } from '../../utils/chat-gateway'

// Sisa pertanyaan hari ini untuk penanya ini (per akun bila masuk, per IP bila tidak).
export default defineEventHandler(async (event) => {
	try {
		return await $fetch<{ limit: number, remaining: number, signedIn: boolean, resetAt: number | null }>(chatGatewayUrl(event, '/v1/quota'), {
			headers: await chatGatewayHeaders(event),
			timeout: 10000
		})
	} catch {
		throw createError({ status: 502, statusText: 'Sisa kuota Maja belum bisa dimuat.' })
	}
})
