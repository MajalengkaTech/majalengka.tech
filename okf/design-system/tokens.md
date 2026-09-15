---
type: Specification
title: Design Tokens Majalengka Design System
description: Definisi token visual dasar mencakup palet warna alam Ciremai, tipografi modern, dan skala pengukuran konsisten.
tags: [tokens, colors, typography, spacing, style-dictionary]
status: active
verified: human:narr07
sources:
  - type: manual
    name: Grok Design System Rundingan
---

# Design Tokens

Design Tokens menyimpan nilai-nilai desain dasar dalam format data terstruktur (W3C Design Token Community Group format) yang dapat dikonversi ke CSS Variables, Tailwind, atau UnoCSS.

## 1. Warna (Color Palette)

Palet warna MDS menggabungkan elemen visual kehijauan lereng Gunung Ciremai dan identitas digital modern:

| Token Semantik | Token Nama | Nilai HEX / HSL | Penggunaan |
|---|---|---|---|
| `--color-primary-500` | Emerald Forest | `#059669` | Aksi utama, brand instansi, tautan penting |
| `--color-primary-600` | Deep Ciremai | `#047857` | Hover button, penekanan teks |
| `--color-secondary-500`| Tech Teal | `#0d9488` | Aksen pendukung, lencana, visual badge |
| `--color-surface` | Pure White / Slate 900 | `#ffffff` / `#0f172a` | Latar belakang permukaan |
| `--color-text-primary` | Charcoal Slate | `#0f172a` / `#f8fafc` | Teks utama dengan kontras minimal 7:1 |
| `--color-border-subtle`| Hairline Gray | `#e2e8f0` / `#1e293b` | Garis batas tipis netral |

## 2. Tipografi (Typography)

Menggunakan keluarga huruf sans-serif modern yang sangat mudah dibaca pada berbagai ukuran resolusi layar:
- **Font Utama**: `Inter, system-ui, -apple-system, sans-serif`
- **Heading Display**: Berat 600 (Semi-bold) & 700 (Bold)
- **Body Text**: Ukuran dasar `16px` (1rem), line-height `1.6`

## 3. Skala Spacing

Skala 4-point grid sistem konsisten:
- `space-1`: 4px (0.25rem)
- `space-2`: 8px (0.5rem)
- `space-3`: 12px (0.75rem)
- `space-4`: 16px (1rem)
- `space-6`: 24px (1.5rem)
- `space-8`: 32px (2rem)
- `space-12`: 48px (3rem)
- `space-16`: 64px (4rem)

## 4. Pipeline Transformasi
Tokens dapat ditransformasi otomatis menggunakan **Style Dictionary**:
```bash
style-dictionary build --config config.json
```
Output:
- `dist/tokens.css` (CSS Custom Properties)
- `dist/tailwind-preset.js` (Tailwind / UnoCSS preset)
