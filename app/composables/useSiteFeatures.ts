export interface SiteFeatures {
	email: boolean
	turnstileSiteKey: string | null
}

export function useSiteFeatures() {
	return useFetch<SiteFeatures>('/api/site-features', {
		key: 'site-features',
		default: () => ({ email: false, turnstileSiteKey: null })
	})
}
