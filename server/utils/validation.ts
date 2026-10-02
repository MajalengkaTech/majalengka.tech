import type { H3Event } from 'h3'
import type { ZodType } from 'zod'

// readValidatedBody bawaan h3 membungkus error apa pun menjadi "Validation Error"; pengguna perlu tahu isian mana yang salah.
function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
	const result = schema.safeParse(data)
	if (!result.success) {
		throw createError({
			statusCode: 400,
			statusMessage: result.error.issues[0]?.message || 'Isian belum valid. Periksa lagi lalu kirim ulang.',
			data: { issues: result.error.issues }
		})
	}
	return result.data
}

export async function readBodyWith<T>(event: H3Event, schema: ZodType<T>) {
	return parseOrThrow(schema, await readBody(event))
}

export function getQueryWith<T>(event: H3Event, schema: ZodType<T>) {
	return parseOrThrow(schema, getQuery(event))
}
