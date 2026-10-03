import type { AppConfigInput as SchemaAppConfigInput } from '@nuxt/schema'

// nanime menambah AppConfigInput lewat 'nuxt/schema', sedangkan Nuxt UI lewat '@nuxt/schema'.
// Akibatnya `ui` versi input (semua opsional) tertutup oleh versi runtime yang wajib lengkap; jembatan ini mengembalikannya.
declare module 'nuxt/schema' {
	interface AppConfigInput {
		ui?: SchemaAppConfigInput['ui']
	}
}

export {}
