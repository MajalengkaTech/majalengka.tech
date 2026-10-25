// Email dikirim lewat API HTTP Resend dengan fetch biasa, jadi tidak perlu SDK tambahan.
export interface EmailConfig {
	apiKey: string
	from: string
}

interface EmailMessage {
	to: string
	subject: string
	heading: string
	intro: string
	actionLabel: string
	actionUrl: string
	outro: string
}

export function emailConfigFrom(runtimeConfig?: { resend?: { apiKey?: string, from?: string } }): EmailConfig | null {
	const apiKey = runtimeConfig?.resend?.apiKey || process.env.NUXT_RESEND_API_KEY || ''
	const from = runtimeConfig?.resend?.from || process.env.NUXT_RESEND_FROM || ''
	return apiKey && from ? { apiKey, from } : null
}

function escapeHtml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderHtml(message: EmailMessage) {
	const url = escapeHtml(message.actionUrl)
	return `<!doctype html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
	<div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
		<p style="margin:0 0 24px;font-weight:bold;color:#0014A8">Majalengka Tech</p>
		<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(message.heading)}</h1>
		<p style="margin:0 0 24px;line-height:1.6">${escapeHtml(message.intro)}</p>
		<a href="${url}" style="display:inline-block;background:#0014A8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:6px">${escapeHtml(message.actionLabel)}</a>
		<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#475569">${escapeHtml(message.outro)}</p>
		<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#475569;word-break:break-all">Kalau tombolnya tidak bisa diklik, salin link ini ke browser: ${url}</p>
	</div>
</body>
</html>`
}

function renderText(message: EmailMessage) {
	return `${message.heading}\n\n${message.intro}\n\n${message.actionLabel}: ${message.actionUrl}\n\n${message.outro}\n\nMajalengka Tech`
}

export async function sendEmail(config: EmailConfig | null, message: EmailMessage) {
	if (!config) {
		throw new Error('Pengiriman email belum aktif: NUXT_RESEND_API_KEY dan NUXT_RESEND_FROM belum diisi.')
	}
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${config.apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: config.from,
			to: [message.to],
			subject: message.subject,
			html: renderHtml(message),
			text: renderText(message)
		}),
		signal: AbortSignal.timeout(10_000)
	})
	if (!response.ok) {
		// Isi balasan Resend menjelaskan penyebabnya (domain belum terverifikasi, kunci salah) tanpa memuat kunci.
		throw new Error(`Resend menolak email (${response.status}): ${await response.text()}`)
	}
}
