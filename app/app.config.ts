import { spring } from '#nanime/easings'

export default defineAppConfig({
	ui: {
		colors: {
			primary: 'brand',
			neutral: 'slate'
		},
		icons: {
			arrowDown: 'i-tabler-arrow-down',
			arrowLeft: 'i-tabler-arrow-left',
			arrowRight: 'i-tabler-arrow-right',
			arrowUp: 'i-tabler-arrow-up',
			caution: 'i-tabler-alert-square-rounded',
			check: 'i-tabler-check',
			chevronDoubleLeft: 'i-tabler-chevrons-left',
			chevronDoubleRight: 'i-tabler-chevrons-right',
			chevronDown: 'i-tabler-chevron-down',
			chevronLeft: 'i-tabler-chevron-left',
			chevronRight: 'i-tabler-chevron-right',
			chevronUp: 'i-tabler-chevron-up',
			close: 'i-tabler-x',
			copy: 'i-tabler-copy',
			copyCheck: 'i-tabler-copy-check',
			dark: 'i-tabler-moon',
			drag: 'i-tabler-grip-vertical',
			ellipsis: 'i-tabler-dots',
			error: 'i-tabler-square-rounded-x',
			external: 'i-tabler-external-link',
			eye: 'i-tabler-eye',
			eyeOff: 'i-tabler-eye-off',
			file: 'i-tabler-file',
			folder: 'i-tabler-folder',
			folderOpen: 'i-tabler-folder-open',
			hash: 'i-tabler-hash',
			info: 'i-tabler-info-square-rounded',
			light: 'i-tabler-sun',
			loading: 'i-tabler-loader-2',
			menu: 'i-tabler-menu',
			minus: 'i-tabler-minus',
			panelClose: 'i-tabler-layout-sidebar-left-collapse',
			panelOpen: 'i-tabler-layout-sidebar-left-expand',
			plus: 'i-tabler-plus',
			reload: 'i-tabler-reload',
			search: 'i-tabler-search',
			stop: 'i-tabler-player-stop',
			star: 'i-tabler-star',
			success: 'i-tabler-square-rounded-check',
			system: 'i-tabler-device-desktop',
			tip: 'i-tabler-bulb',
			upload: 'i-tabler-upload',
			warning: 'i-tabler-alert-triangle'
		},
		// Umpan balik tekan: tombol sedikit mengecil saat ditekan. motion-safe mematikannya untuk yang memilih gerak dikurangi.
		button: {
			slots: {
				base: 'transition-[color,background-color,border-color,box-shadow,transform] duration-150 motion-safe:active:scale-[0.97]'
			}
		}
	},
	// Gaya transisi nanime yang dipakai bersama. Saat gerak dikurangi, app.vue mengganti semuanya dengan durasi 0.
	nanime: {
		transitions: {
			// Kartu dan baris daftar: masuk dengan pegas kecil, keluar memudar cepat, sisanya bergeser rapat.
			'mt-item': {
				enter: { opacity: [0, 1], scale: [0.94, 1], ease: spring({ bounce: 0.15, duration: 380 }) },
				leave: { opacity: 0, scale: 0.96, duration: 160, ease: 'out(2)' },
				move: { duration: 320, ease: 'out(3)' }
			},
			// Teks status yang berganti, seperti hasil cek username.
			'mt-status': {
				enter: { opacity: [0, 1], y: [-4, 0], duration: 220, ease: 'out(3)' },
				leave: { opacity: 0, duration: 100, ease: 'out(2)' }
			},
			// Angka kecil yang berubah, seperti jumlah komentar.
			'mt-count': {
				enter: { opacity: [0, 1], scale: [0.6, 1], ease: spring({ bounce: 0.3, duration: 300 }) },
				leave: { opacity: 0, scale: 0.6, duration: 100 }
			}
		}
	}
})
