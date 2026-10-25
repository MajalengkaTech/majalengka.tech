---
type: Technical Specification
title: Spesifikasi Teknis Open Knowledge Format (OKF v0.2)
description: Aturan sintaks YAML frontmatter, struktur bundle, dan konvensi penamaan file OKF.
tags: [okf, spec, metadata, yaml, frontmatter]
status: active
verified: human:narr07
sources:
  - type: specification
    name: Google Cloud Open Knowledge Format SPEC.md
    url: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md
---

# Spesifikasi Teknis OKF v0.2

## 1. Anatomi Berkas Dokumen Konsep
Setiap konsep didefinisikan dalam satu berkas Markdown (`.md`) dengan blok **YAML Frontmatter** di bagian atas:

```yaml
---
type: Concept | System | Guideline | Project | Dataset | API
title: Nama Konsep Jelas
description: Satu kalimat ringkas menjelaskan tujuan konsep.
resource: urn:majalengka:resource-id (opsional)
tags: [tag-1, tag-2]
status: active | draft | deprecated
verified: human:narr07
sources:
  - type: standard | manual | repo
    name: Nama Sumber Rujukan
    url: https://...
---

# Judul Konsep

Konten markdown deskriptif dengan heading terstruktur, tabel, dan diagram mermaid jika diperlukan.
```

## 2. Struktur Bundle
- `index.md`: Berkas indeks direktori untuk progressive disclosure hierarki folder.
- `log.md`: Berkas catatan riwayat pembaruan bundle secara kronologis.
- Berkas Markdown bebas menggunakan nama kebab-case (misal: `design-tokens.md`).
- Tautan silang antar konsep menggunakan sintaks tautan markdown relatif: `[Nama Konsep](nama-konsep.md)`.
