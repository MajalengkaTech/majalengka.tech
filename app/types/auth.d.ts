declare module '#auth-utils' {
	interface User {
		id?: string | number
		name?: string
		login?: string
		email?: string
		avatar?: string
		provider?: string
	}
}

declare module 'nuxt-auth-utils' {
	interface User {
		id?: string | number
		name?: string
		login?: string
		email?: string
		avatar?: string
		provider?: string
	}
}

export {}
