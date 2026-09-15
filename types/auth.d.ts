declare module '#auth-utils' {
	interface User {
		id: string | number
		name: string
		login?: string
		email?: string
		avatar?: string
		provider: 'github' | 'google' | 'local'
	}
}

export {}
