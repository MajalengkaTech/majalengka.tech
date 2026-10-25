import type { H3Event } from 'h3'
import { useLogger } from 'evlog'
import type { ServerEvent } from './validation'

// Sasaran aksi admin (akun atau proyek) ikut tercatat di log aktivitas, supaya terbaca siapa melakukan apa ke siapa.
export function logTarget(event: ServerEvent, target: Record<string, unknown>) {
	useLogger(event as H3Event).set({ target })
}
