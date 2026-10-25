import type { H3Event } from 'h3'
import { getQuery, readBody, type RequestEvent } from 'nuxt/server'
import type { ZodType } from 'zod'

export type ServerEvent = H3Event | RequestEvent

type BodyEvent = Parameters<typeof readBody>[0]
type QueryEvent = Parameters<typeof getQuery>[0]

// readValidatedBody bawaan h3 membungkus error apa pun menjadi "Validation Error"; pengguna perlu tahu isian mana yang salah.
function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
	const result = schema.safeParse(data)
	if (!result.success) {
		throw createError({
			status: 400,
			statusText: result.error.issues[0]?.message || 'Isian belum valid. Periksa lagi lalu kirim ulang.',
			data: { issues: result.error.issues }
		})
	}
	return result.data
}

export async function readBodyWith<T>(event: ServerEvent, schema: ZodType<T>) {
	return parseOrThrow(schema, await readBody(event as unknown as BodyEvent))
}

export function getQueryWith<T>(event: ServerEvent, schema: ZodType<T>) {
	return parseOrThrow(schema, getQuery(event as unknown as QueryEvent))
}
