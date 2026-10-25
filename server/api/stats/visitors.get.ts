// Jumlah pengunjung 30 hari terakhir dari SimpleAnalytics. Dicache sejam supaya API mereka tidak dipanggil tiap kunjungan.
export default defineCachedEventHandler(async () => {
	const config = useRuntimeConfig()
	const apiKey = config.simpleAnalytics.apiKey
	if (!apiKey) return { visitors: null }

	const hostname = new URL(config.public.siteUrl).hostname
	try {
		const res = await $fetch<{ ok?: boolean, visitors?: unknown }>(`https://simpleanalytics.com/${hostname}.json`, {
			query: { version: 6, fields: 'visitors', start: 'today-30d', end: 'today' },
			headers: { 'Api-Key': apiKey },
			timeout: 5000
		})
		return { visitors: res.ok !== false && typeof res.visitors === 'number' ? res.visitors : null }
	} catch {
		return { visitors: null }
	}
}, { name: 'simple-analytics-visitors', maxAge: 60 * 60, swr: true })
