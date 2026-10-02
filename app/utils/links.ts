import type { NavigationMenuItem } from '@nuxt/ui'

export const navLinks: NavigationMenuItem[] = [{
	label: 'Showcase',
	icon: 'i-lucide-layout-grid',
	to: '/projek'
}, {
	label: 'Tentang',
	icon: 'i-lucide-info',
	to: '/tentang'
}, {
	label: 'Panduan',
	icon: 'i-lucide-book-open',
	to: '/docs'
}, {
	label: 'Changelog',
	icon: 'i-lucide-history',
	to: '/changelog'
}]
