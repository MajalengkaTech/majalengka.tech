const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 3600],
	['month', 30 * 24 * 3600],
	['week', 7 * 24 * 3600],
	['day', 24 * 3600],
	['hour', 3600],
	['minute', 60]
]

export function formatTanggal(value: string | number | Date | null | undefined) {
	if (!value) return ''
	return dateFormatter.format(new Date(value))
}

export function waktuRelatif(value: string | number | Date | null | undefined) {
	if (!value) return ''
	const seconds = (new Date(value).getTime() - Date.now()) / 1000
	for (const [unit, size] of RELATIVE_STEPS) {
		if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit)
	}
	return 'baru saja'
}

export function splitTags(tags?: string | null) {
	return (tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
}

export function categoryLabel(category?: string | null) {
	return PROJECT_CATEGORIES[(category || 'lainnya') as ProjectCategory] || PROJECT_CATEGORIES.lainnya
}
