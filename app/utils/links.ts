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
	label: 'Blog',
	icon: 'i-lucide-newspaper',
	to: '/blog'
}, {
	label: 'Dokumentasi',
	icon: 'i-lucide-book-open',
	to: '/docs'
}]
