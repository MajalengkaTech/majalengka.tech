import { chatGatewayHeaders, chatGatewayUrl } from '../utils/chat-gateway'

// Proxy chat Maja: meneruskan pertanyaan ke gateway instabox dan mengalirkan jawabannya (SSE) ke browser.
export default defineEventHandler(async (event) => {
	const body = await readRawBody(event)
	if (!body || body.length > 65536) {
		throw createError({ status: 400, statusText: 'Pertanyaannya kosong atau terlalu panjang. Coba ringkas lalu kirim lagi.' })
	}

	let res: Response
	try {
		res = await fetch(chatGatewayUrl(event, '/v1/chat'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...await chatGatewayHeaders(event) },
			body,
			signal: AbortSignal.timeout(60000)
		})
	} catch {
		throw createError({ status: 502, statusText: 'Maja sedang tidak bisa dihubungi. Coba lagi beberapa menit lagi.' })
	}

	// Error gateway (400, 429) diteruskan apa adanya supaya panel bisa membaca kode dan waktu reset kuota.
	if (!res.ok) {
		setResponseStatus(event, res.status)
		const text = await res.text()
		try {
			return JSON.parse(text)
		} catch {
			return { error: 'Gateway error', message: 'Maja sedang bermasalah. Coba lagi beberapa menit lagi.' }
		}
	}

	setResponseHeaders(event, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'X-Accel-Buffering': 'no'
	})
	return res.body ? sendStream(event, res.body) : null
})
