# Nuxt UI Component Rules

## Prioritas Utama
1. SELALU cek dulu apakah ada komponen Nuxt UI (prefix `U`, contoh: UButton, UModal, UCard, 
   UInputRating, UFieldGroup, UEmpty, USkeleton, UTabs, USelectMenu, dll) sebelum menulis 
   HTML/CSS custom atau komponen buatan sendiri.
2. Jangan reinvent komponen yang sudah tersedia. Contoh:
   - Rating bintang → gunakan `UInputRating`, jangan loop manual `<button><UIcon></button>`.
   - Skeleton loading → gunakan `USkeleton`, jangan div `animate-pulse` manual.
   - Empty state → gunakan `UEmpty`, jangan div custom dengan icon+title+description manual.
   - Grup input+button (search+refresh, dsb) → gunakan `UFieldGroup`.
   - Filter/pilihan tunggal → gunakan `UTabs` (kalau opsi sedikit & perlu selalu terlihat) 
     atau `USelectMenu` (kalau opsi banyak atau perlu hemat tempat).
   - Notifikasi hasil aksi → gunakan `useToast()`, jangan `alert()`.
   - Konfirmasi hapus/aksi penting → gunakan `UModal` kecil, jangan `window.confirm()`.
   - Header/hero halaman → gunakan `UPageHero` / `UPageHeader`, jangan div+h1+p manual.
   - Card konten → gunakan `UCard` / `UPageCard`, jangan div dengan border+shadow manual.
3. Sebelum menulis kode baru, jika ragu apakah ada komponen Nuxt UI yang cocok, 
   cari dulu di dokumentasi (`search-components`, `get-component-metadata`) 
   daripada menebak atau membuat versi custom.

## Styling & Tema
4. Jangan hardcode warna Tailwind mentah (`bg-neutral-100`, `text-red-500`, `border-gray-200`, 
   dst). Gunakan token semantik Nuxt UI: `text-highlighted`, `text-muted`, `text-dimmed`, 
   `bg-elevated`, `bg-muted`, `border-default`, `border-muted`, dan prop `color` 
   (`primary`, `neutral`, `error`, `success`, `warning`, `info`) pada komponen.
   → Ini memastikan tampilan otomatis konsisten di light/dark mode dan ikut tema project.
5. Gunakan prop bawaan komponen (`variant`, `size`, `color`) untuk styling, bukan class 
   Tailwind manual yang menimpa tampilan default komponen, kecuali benar-benar perlu 
   penyesuaian kecil lewat prop `ui`.
6. Radius, spacing, dan ukuran ikuti default tema Nuxt UI app-mu (`app.config.ts`) — jangan 
   override radius/spacing manual per komponen kecuali diminta eksplisit.

## Struktur & Slot
7. Manfaatkan slot resmi komponen (`#header`, `#body`, `#footer`, `#title`, `#description`, 
   `#actions`, dst) daripada membungkus ulang komponen dengan div tambahan di luar slot yang 
   sudah disediakan.
8. Untuk komponen dengan banyak state (Modal, Drawer, SelectMenu), gunakan prop bawaan 
   (`scrollable`, `dismissible`, `clear`, `loading`, dll) daripada menambah logic/CSS manual 
   untuk mensimulasikan behavior yang sudah ada.

## UX Behavior
9. Setiap aksi async (submit, delete, refresh) HARUS punya state `:loading` yang terhubung 
   ke tombol terkait — user harus selalu tahu sistem sedang bekerja.
10. Setiap error dari API harus ditampilkan lewat `useToast()` atau `UAlert`, dengan pesan 
    yang jelas dan actionable (contoh: ada tombol "Coba Lagi"), jangan gagal diam-diam.
11. Aksi yang butuh banyak langkah (buka modal → cari elemen → isi → submit) untuk task 
    sederhana (misal kasih rating cepat) HARUS disederhanakan menjadi aksi langsung/inline 
    jika Nuxt UI punya komponen yang mendukungnya (contoh: `UInputRating` inline di card, 
    bukan wajib lewat modal).
12. Untuk konten yang panjang dalam Modal, gunakan `scrollable` + pertimbangkan `UTabs` 
    untuk memecah konten jadi beberapa bagian logis, hindari satu scroll panjang tanpa 
    struktur.
13. Selalu sediakan empty state (`UEmpty`) dan loading state (`USkeleton`) untuk setiap 
    data yang di-fetch — jangan biarkan halaman kosong/blank saat loading atau tidak ada data.

## Nuxt-specific
14. Manfaatkan auto-import Nuxt — jangan tulis `import { ref, computed } from 'vue'` atau 
    import manual komponen Nuxt UI/composable Nuxt UI (`useToast`, `useOverlay`, dst).
15. Gunakan `app.config.ts` untuk override tema global (warna, radius, icon) daripada 
    override berulang di tiap komponen.

## Kalau Ragu
16. Jika tidak yakin komponen Nuxt UI mana yang paling tepat untuk suatu kebutuhan UI, 
    cari dulu lewat dokumentasi/MCP tools sebelum membuat solusi custom. Custom HTML/CSS 
    hanya boleh dipakai untuk struktur layout dasar (grid, flex container) yang memang 
    tidak disediakan sebagai komponen.
