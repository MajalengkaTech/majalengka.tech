# Rencana Implementasi: Website Majalengka Tech & Open Knowledge Format (OKF)

Inisiatif pembuatan website resmi **majalengka.tech** menggunakan basis template resmi **Nuxt UI SaaS** (`nuxt-ui-templates/saas`) serta implementasi dan integrasi standar **Open Knowledge Format (OKF)** dari Google Cloud Platform sesuai dengan hasil rundingan desain sistem dan roadmap komunitas Majalengka Tech.

---

## Ringkasan Proyek & Arsitektur

1. **Website Framework**: Nuxt 4 + Nuxt UI v4 + `@nuxt/content` v3 + Tailwind CSS v4.
2. **Package Manager & Tooling**: **Bun** (`bun install`, `bun run dev`, `bun run build`) sesuai user rules.
3. **Coding Standards**:
   - Quotes: Single quotes (`singleQuote: true`).
   - Indentasi: Tab, ukuran 2 (`useTabs: true, tabSize: 2`).
   - Single attribute per line untuk template/HTML.
   - Tag `<script setup lang="ts">` diletakkan paling atas di setiap komponen Vue.
4. **Konten & Branding Majalengka Tech** (berdasarkan `hasil rundingan dengan  grok.md`):
   - Hero: Komunitas tech lokal & ekosistem open-source Majalengka.
   - 5 Inisiatif Unggulan: AgriTech (Smart Farming IoT), Majalengka Tourism & Local Guide, Digitalisasi UMKM, Open Educational Resources, dan Open Data Dashboard.
5. **Majalengka Design System (MDS)** (berdasarkan `hasil rundingan dengan  grok design sustem.md`):
   - Dokumentasi token desain, panduan aksesibilitas WCAG 2.1 AA, keselarasan dengan IDDS (INA Digital Design System), dan komponen instansi pemerintah daerah.
6. **Open Knowledge Format (OKF)** (berdasarkan `GoogleCloudPlatform/open-knowledge-format` v0.2 spec):
   - Struktur bundle OKF di dalam repository (`okf/` atau terintegrasi dengan Nuxt Content) berisi konsep-konsep knowledge graph (YAML frontmatter + markdown links) yang agent-ready dan human-readable.
   - Halaman panduan OKF di dalam Docs agar kontributor dan agen AI dapat membaca & membuat metadata knowledge secara terstandar.

---

## Proposed Changes

### 1. Inisialisasi & Migrasi Template Nuxt UI SaaS ke Root
- Memindahkan file proyek dari template `temp_saas` ke direktori root `e:\website\majalengka.tech\` tanpa mengganggu folder `.git/`, `.agents/`, `.roo/`, serta catatan riset markdown yang sudah ada.
- Menghapus folder sementara `temp_saas`.
- Konfigurasi `package.json` untuk menggunakan `bun` sebagai package manager dan menginstal semua dependensi via `bun install`.

#### [NEW] [package.json](file:///e:/website/majalengka.tech/package.json)
- Konfigurasi skrip (`dev`, `build`, `lint`, `typecheck`), dependensi `@nuxt/ui`, `@nuxt/content`, Tailwind v4, `@vueuse/nuxt`, dll.

#### [NEW] [nuxt.config.ts](file:///e:/website/majalengka.tech/nuxt.config.ts)
- Konfigurasi module Nuxt, route rules, Nitro prerender, dan pengaturan style.

#### [NEW] [.prettierrc](file:///e:/website/majalengka.tech/.prettierrc) & [eslint.config.mjs](file:///e:/website/majalengka.tech/eslint.config.mjs)
- Konfigurasi format tab, single quotes, single attribute per line, dan vue-indent.

---

### 2. Kustomisasi Branding & Identitas Majalengka Tech
- Menyesuaikan `app/app.config.ts` untuk nama "Majalengka Tech", deskripsi, tautan sosial/GitHub, dan tema warna visual bernuansa hijau alam Ciremai & tech modern.
- Menyesuaikan header & footer navigasi (`app/components/AppHeader.vue`, `app/components/AppFooter.vue`).

#### [MODIFY] [app/app.config.ts](file:///e:/website/majalengka.tech/app/app.config.ts)
- Pengaturan metadata global, navigasi menu (Inisiatif, Design System, OKF Docs, Blog, GitHub).

#### [MODIFY] [content/0.index.yml](file:///e:/website/majalengka.tech/content/0.index.yml)
- Hero section: "Membangun Ekosistem Teknologi & Open Source dari Majalengka".
- Section fitur: AgriTech Smart Farming, Majalengka Tourism Open Platform, Digitalisasi UMKM, Edukasi Coding/AI, Open Data Daerah.
- CTA: Bergabung ke GitHub Organization & Komunitas Majalengka Tech.

---

### 3. Implementasi Dokumentasi Majalengka Design System (MDS)
- Menambahkan dokumentasi di `content/1.docs/` tentang:
  - Prinsip Desain Pemerintah Daerah (IDDS inspired).
  - Design Tokens (Warna, Tipografi Inter, Spacing, Elevasi).
  - Aksesibilitas WCAG 2.1 AA.

---

### 4. Implementasi Open Knowledge Format (OKF) Google Cloud Platform
- Menyediakan direktori bundle standar OKF di `okf/` sesuai spesifikasi resmi v0.2:
  - `okf/bundle.yaml`: Manifest metadata bundle Majalengka Tech.
  - `okf/concepts/`:
    - `majalengka-design-system.md`: Konsep token & komponen design system (YAML frontmatter: `type: concept`, `title`, `description`, `tags`, `verified`).
    - `agritech-iot-farm.md`: Spesifikasi open data & sensor pertanian lokal.
    - `open-tourism-api.md`: Format data pariwisata & UMKM terbuka.
    - `okf-standard-guide.md`: Dokumentasi spesifikasi Google Cloud OKF untuk agent & human interoperability.
- Menyediakan halaman dokumentasi OKF interaktif di web (`/docs/open-knowledge-format`).

---

## Verification Plan

### Automated / CLI Verification
1. **Dependency Installation**:
   ```bash
   bun install
   ```
2. **Build & Typecheck**:
   ```bash
   bun run typecheck
   bun run build
   ```
3. **Linting Check**:
   ```bash
   bun run lint
   ```

### Obscura Headless Browser Testing & Screenshot
1. Jalankan server lokal:
   ```bash
   bun run dev
   ```
2. Pengujian visual dan pengambilan screenshot menggunakan **Obscura** sesuai standar project:
   ```bash
   C:\Users\hp\.obscura\obscura.exe fetch http://localhost:3000 --allow-private-network --screenshot C:\Users\hp\.gemini\antigravity-ide\brain\fc146f47-243f-44ee-8ef2-3c9b16d26b6f\majalengka_tech_home.png
   ```
   dan pengujian halaman docs / OKF:
   ```bash
   C:\Users\hp\.obscura\obscura.exe fetch http://localhost:3000/docs --allow-private-network --screenshot C:\Users\hp\.gemini\antigravity-ide\brain\fc146f47-243f-44ee-8ef2-3c9b16d26b6f\majalengka_tech_docs.png
   ```
