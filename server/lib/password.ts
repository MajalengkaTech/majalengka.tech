import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { hashPassword as jsHashPassword, verifyPassword as jsVerifyPassword } from '@better-auth/utils/password'

// Parameter dan format sama persis dengan bawaan Better Auth (`salt:key`, hex), jadi hash lama tetap valid.
const N = 16384
const r = 16
const p = 1
const dkLen = 64

// Bawaan Better Auth menghitung scrypt di JavaScript dan mengalokasikan ±32 MB di heap Worker per hash.
// Daftar atau login bersamaan bisa menembus batas memori 128 MB (Error 1102). node:crypto menghitungnya native.
function deriveKey(password: string, salt: string) {
	return new Promise<Buffer>((resolve, reject) => {
		scrypt(password.normalize('NFKC'), salt, dkLen, { N, r, p, maxmem: 128 * N * r * 2 }, (error, key) => {
			if (error) reject(error)
			else resolve(key)
		})
	})
}

export async function hashUserPassword(password: string) {
	const salt = randomBytes(16).toString('hex')
	try {
		const key = await deriveKey(password, salt)
		return `${salt}:${key.toString('hex')}`
	} catch {
		return jsHashPassword(password)
	}
}

export async function verifyUserPassword({ hash, password }: { hash: string, password: string }) {
	const [salt, key] = hash.split(':')
	if (!salt || !key) return false
	try {
		const target = await deriveKey(password, salt)
		const expected = Buffer.from(key, 'hex')
		return expected.length === target.length && timingSafeEqual(expected, target)
	} catch {
		return jsVerifyPassword(hash, password)
	}
}
