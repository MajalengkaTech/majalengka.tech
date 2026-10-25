import type { NavigationMenuItem } from '@nuxt/ui'

export const navLinks: NavigationMenuItem[] = [{
	label: 'Showcase',
	icon: 'i-lucide-layout-grid',
	to: '/projek'
}, {
	label: 'Kreator',
	icon: 'i-lucide-users',
	to: '/kreator'
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
