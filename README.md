HEAD
# PM Checklist App — IT Site Operation SIG

Aplikasi otomasi Preventive Maintenance (PM) checklist untuk 3 kategori device:
**PC/Laptop**, **Printer**, dan **Switch**. Stack: Node.js/Express, PostgreSQL,
React, Puppeteer (PDF generation).

## Status: Selesai — PC/Laptop, Printer, Switch ✅

## Fitur

- Login & role (teknisi / it_site_operations)
- Lookup aset by Serial Number (normalisasi trim + uppercase)
- Pendaftaran aset baru (dropdown kategori: PC/Laptop, Printer, Switch)
- Form checklist **dinamis** — section & item berbeda tergantung kategori aset:
  - **PC/Laptop**: Check Device Functions (8 item), Standard Software (18 item), Additional Software (6 baris)
  - **Switch**: Check Device Functions (7 item), Device Utilization (Processor/Memory/Temperature), catatan teknisi bebas
  - **Printer**: Check Device Functions (8 item), Device Data (firmware + consumable type dropdown), Stok Tinta (4 warna, free text), catatan teknisi bebas
- Auto-save draft (debounced 1.5 detik) + retry otomatis saat koneksi kembali
- Generate PDF — template terpisah per kategori, layout mengikuti form fisik asli
- Riwayat checklist — filter by device, site, serial number, rentang tanggal
- Dark/Light mode (disimpan per browser)
- Edit ringan Site/Location dari hasil lookup (kalau data aset sudah usang)

## Struktur Project

```
pm-checklist-app/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # koneksi PostgreSQL
│   │   ├── db/
│   │   │   ├── migrate.js
│   │   │   └── migrations/           # 000-009, termasuk field Printer/Switch
│   │   ├── middleware/auth.js        # JWT authenticate + authorize
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── assets.routes.js
│   │   │   └── checklists.routes.js
│   │   ├── templates/
│   │   │   ├── pmChecklistTemplate.js       # PDF: PC/Laptop
│   │   │   ├── switchChecklistTemplate.js   # PDF: Switch
│   │   │   └── printerChecklistTemplate.js  # PDF: Printer
│   │   ├── services/pdfGenerator.js  # Puppeteer wrapper
│   │   ├── utils/checklistDefaults.js # config item checklist per kategori
│   │   └── server.js
│   ├── scripts/
│   │   ├── import-assets-from-excel.js  # import awal data aset dari Excel
│   │   └── seed-admin.js                # bikin user admin pertama
│   ├── storage/checklists/            # PDF hasil generate (gitignored)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/client.js              # fetch wrapper + auth header
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── components/AppLayout.jsx   # header nav + toggle dark mode
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SerialLookupPage.jsx   # lookup + registrasi aset baru
    │   │   ├── ChecklistFormPage.jsx  # form dinamis per kategori
    │   │   ├── ChecklistPreviewPage.jsx
    │   │   └── HistoryPage.jsx
    │   └── App.jsx
    └── package.json
```

## Setup Backend

1. Pastikan PostgreSQL sudah jalan, buat database kosong:
```sql
   -- via psql -U postgres
   CREATE DATABASE pm_checklist_db;
```

2. Install dependency:
```bash
   cd backend
   pnpm install
   pnpm approve-builds   # approve postinstall script (esbuild, puppeteer)
   pnpm install          # ulangi supaya Chromium ke-download
```

3. Copy `.env.example` → `.env`, isi:
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/pm_checklist_db
PORT=4000
JWT_SECRET=ganti-dengan-string-acak-panjang
JWT_EXPIRES_IN=8h
NODE_ENV=development

4. Jalankan migration:
```bash
   pnpm run migrate
```

5. **Import data aset dari Excel** (sekali di awal):
```bash
   # Dry run dulu untuk cek hasil parsing
   node scripts/import-assets-from-excel.js "path/ke/Perangkat Tuban.xlsx" --dry-run

   # Import PC/Laptop
   node scripts/import-assets-from-excel.js "path/ke/Perangkat Tuban.xlsx" --only=PC/Laptop

   # Import Printer & Switch
   node scripts/import-assets-from-excel.js "path/ke/Perangkat Tuban.xlsx" --only=Printer,Switch
```
   Catatan:
   - `asset_name` (kolom Excel yang merged) menentukan kategori: `"PC/Laptop"`, `"Printer"`, atau `"Switch"` — ini yang dipakai sistem untuk pilih form checklist & template PDF, **bukan** kolom `Category`/`Kategori`.
   - Kolom `Site` di-hardcode `"Tuban"`.
   - Asset tag duplikat: soft warning saja (Edge Case 11.1 PRD), tidak diblokir.

6. Bikin user admin pertama:
```bash
   node scripts/seed-admin.js "Nama Lengkap" email@sig.co.id passwordnya
```

7. Jalankan server:
```bash
   pnpm run dev
```
   Cek: `http://localhost:4000/api/v1/health`

## Setup Frontend

```bash
cd frontend
pnpm install
pnpm approve-builds   # kalau ada peringatan esbuild
pnpm install
pnpm run dev
```
Buka `http://localhost:5173`.

## Menambah Kategori Device Baru (di Masa Depan)

Kalau nanti ada kategori device ke-4, ini yang perlu disentuh:
1. `backend/src/utils/checklistDefaults.js` — tambah entry baru di `CHECKLIST_CONFIG`
2. `backend/src/templates/` — buat file template PDF baru
3. `backend/src/routes/checklists.routes.js` — daftarkan builder baru di `getTemplateBuilder()`
4. `frontend/src/pages/SerialLookupPage.jsx` — tambah `<option>` di dropdown Asset Name
5. Migration baru kalau field checklist-nya beda dari yang sudah ada di `pm_checklists`

Tidak perlu ubah skema tabel `assets` — field checklist yang beda-beda ditampung di `pm_checklists` (kolom nullable) dan tabel item (`checklist_device_items`, dst) yang sudah generic lintas kategori.

## Belum Dikerjakan / Catatan untuk Pengembangan Lanjutan

- Multi-user testing menyeluruh (2+ akun teknisi berbeda, memastikan riwayat terpisah dengan benar)
- Edge case Bagian 11 PRD belum ditest eksplisit untuk kategori Printer/Switch (duplikat serial number, dsb — kemungkinan besar sudah otomatis ke-cover karena logic-nya generic, tapi belum diverifikasi manual)
- Approval workflow, notifikasi jadwal PM berikutnya, dan integrasi CMDB — sesuai Non-Goals PRD, di luar cakupan versi ini

# ProjectPMSIG
6a9b33d159d052a156b0ea79ff5e5ebc0268c931
