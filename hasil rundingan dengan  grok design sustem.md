**Siap!** Ini cara menyusun **Design System** yang satu sumber kebenaran (single source of truth), framework-agnostic, khusus untuk website instansi pemerintah/daerah biar gak “asal-asalan”.

Tujuannya: ada aturan visual + komponen yang konsisten, aksesibel, profesional, dan mudah diadopsi baik pakai Tailwind, UnoCSS, plain CSS, Bootstrap, Vue, React, atau bahkan native.

### 1. Prinsip Dasar (Foundation)

Fokus ke kebutuhan website instansi:

- **Kredibel & resmi** → warna sober, tipografi jelas, hierarchy informasi kuat.
- **Aksesibel** → WCAG 2.1 AA minimum (kontras, keyboard navigation, screen reader friendly).
- **Responsif & mobile-first**.
- **Mudah di-maintain** → satu set token yang bisa di-export ke mana saja.
- **Sesuai konteks Indonesia** → dukung bahasa Indonesia, identitas nasional/daerah (logo Garuda, warna resmi jika ada), dan referensi ke **INA Digital Design System (IDDS)** di [design.inadigital.go.id](https://design.inadigital.go.id) sebagai inspirasi resmi pemerintah.

### 2. Struktur Design System (yang direkomendasikan)

Bangun dengan pendekatan **Design Tokens** + **Components** + **Guidelines**.

#### A. Design Tokens (inti yang framework-agnostic)

Ini “satu tujuan” yang kamu maksud. Semua nilai desain disimpan sebagai data (biasanya JSON), lalu di-transform ke format apapun.

Contoh kategori token:

- **Colors**: primary, secondary, neutral, success, warning, error, info + semantic (text-primary, bg-surface, border-subtle, dll).
- **Typography**: font family (Inter atau font resmi), size scale, weight, line-height, letter-spacing.
- **Spacing**: scale konsisten (4/8/12/16/24/32… px atau rem).
- **Border radius, shadow, opacity, z-index, breakpoints**.
- **Motion** (duration, easing) jika perlu.

Tools yang bagus:

- Figma + **Tokens Studio** (plugin) → designer ngatur token di Figma.
- Export ke JSON (format W3C Design Tokens / DTCG).
- Transform dengan **Style Dictionary** atau **Theo** → generate:
  - CSS Variables (`:root { --color-primary: #... }`)
  - Tailwind config
  - UnoCSS config / preset
  - SCSS/Sass variables
  - JSON untuk JS framework
  - bahkan Flutter/Swift kalau mau multi-platform nanti

Hasilnya: satu file token → bisa dipakai di Tailwind (`theme.extend.colors`), UnoCSS, atau pure CSS tanpa duplikasi.

#### B. Components

Bangun komponen UI yang sering dipakai website instansi:

- Header / Navbar (dengan logo instansi + menu)
- Footer
- Button (primary, secondary, ghost, danger)
- Form elements (input, select, checkbox, radio, textarea)
- Card, Alert, Badge, Modal, Tabs, Breadcrumb
- Table, Pagination
- Hero / Banner resmi
- Navigation (sidebar jika admin)
- Accessibility helpers (skip link, focus styles)

Cara implementasi multi-tech:

- Pure CSS + CSS Variables (paling universal)
- Tailwind/UnoCSS utility classes + komponen reusable
- Web Components (lit atau native) supaya benar-benar framework-agnostic
- Atau Storybook untuk dokumentasi + showcase

#### C. Guidelines & Documentation

- Prinsip desain (konsisten, jelas, inklusif, sederhana)
- Aturan penggunaan logo & identitas
- Content guidelines (bahasa resmi, tone of voice)
- Accessibility checklist
- Do’s & Don’ts
- Contoh halaman lengkap (homepage dinas, halaman layanan, berita, profil)

Dokumentasi terbaik: website sendiri (bisa pakai Storybook, VitePress, Docusaurus, atau Nextra) yang di-host di `design.majalengka.tech` atau sejenis.

### 3. Langkah-langkah Praktis Membangunnya

1. **Riset & Audit**  
   Lihat website instansi yang bagus (nasional + daerah) + IDDS. Catat pain point website instansi yang “asal”.

2. **Definisikan Tokens di Figma**  
   Buat file Figma master → pakai Tokens Studio.

3. **Setup Repo Open Source**  
   Di GitHub org Majalengka Tech:
   - `design-tokens` (JSON + Style Dictionary config)
   - `css` / `tailwind-preset` / `unocss-preset`
   - `components` (contoh implementasi)
   - `docs` (dokumentasi)
   - License: MIT atau Apache biar mudah diadopsi instansi lain.

4. **Generate & Publish**
   - npm package: `@majalengka-tech/design-tokens`, `@majalengka-tech/tailwind-preset`, dll.
   - Atau langsung CSS file yang tinggal import.

5. **Contoh Implementasi**  
   Buat starter template website instansi (Next.js + Tailwind, Astro + UnoCSS, plain HTML, dll) yang sudah pakai design system-mu.

6. **Governance**  
   Buat aturan sederhana: “Website resmi instansi Majalengka wajib pakai design system ini (atau setidaknya tokens-nya)”. Bisa jadi rekomendasi ke Diskominfo atau UNMA.

### 4. Tech Stack Rekomendasi Awal

- **Design**: Figma + Tokens Studio
- **Tokens**: Style Dictionary
- **Docs**: Storybook atau VitePress
- **CSS base**: CSS Variables + optional Tailwind/UnoCSS preset
- **Icons**: Lucide atau Phosphor (open source, konsisten)

### 5. Nama & Branding Saran

- **Majalengka Design System** / **MDS**
- atau **GovUI Majalengka** / **Instansi Design System**
- Domain: `design.majalengka.tech` atau `ui.majalengka.tech`

Ini bisa jadi proyek open-source unggulan org-mu: membantu instansi lokal bikin website yang rapi, aksesibel, dan konsisten, sekaligus menunjukkan bahwa Majalengka Tech serius di open-source.

Kalau mau, saya bisa bantu:

- Outline struktur folder repo
- Contoh JSON design tokens awal (warna, typography, spacing)
- Konfigurasi Style Dictionary dasar
- Atau draft README-nya

Mau mulai dari mana dulu? Tokens, komponen, atau struktur repo-nya?
