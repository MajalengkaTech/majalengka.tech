import { defineMcpTool } from '@nuxtjs/mcp-toolkit/server'

export default defineMcpTool({
	name: 'info_situs',
	description: 'Menjelaskan apa itu Majalengka Tech, halaman-halaman pentingnya, dan cara kreator memamerkan proyek.',
	handler: () => ({
		nama: 'Majalengka Tech',
		url: 'https://majalengka.tech',
		tentang: 'Etalase proyek dan profil kreator (developer dan desainer) dari Majalengka, Jawa Barat. Gratis dan kodenya terbuka (MIT).',
		halaman: {
			proyek: 'https://majalengka.tech/projek',
			kreator: 'https://majalengka.tech/kreator',
			tutorial: 'https://majalengka.tech/tutorial',
			panduan: 'https://majalengka.tech/docs/getting-started',
			tentang: 'https://majalengka.tech/tentang',
			catatanRilis: 'https://majalengka.tech/changelog',
			llms: 'https://majalengka.tech/llms.txt'
		},
		caraBergabung: 'Daftar di https://majalengka.tech/signup, pilih username, lalu pamerkan proyek lewat dashboard.',
		kode: 'https://github.com/MajalengkaTech/majalengka.tech'
	})
})
