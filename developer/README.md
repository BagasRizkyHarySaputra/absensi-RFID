# Developer Folder - Absensi RFID Backend

## 📁 Struktur
```
developer/
├── app.py                  # Flask backend untuk ESP32 & Admin
├── database.py            # Supabase client setup
├── templates/
│   ├── dashboard_admin.html   # Admin panel untuk manage kehadiran
│   └── redirect_admin.html    # Landing page dengan auto-redirect
└── static/
    ├── css/
    │   └── admin.css      # Styling untuk admin panel
    └── js/
        └── admin.js       # JavaScript untuk admin panel
```

## 🚀 Menjalankan Server

```bash
cd developer
python app.py
```

Server akan berjalan di: **http://localhost:5000**

## 📡 API Endpoints untuk ESP32

### 1. POST /api/absensi
Endpoint untuk ESP32 mengirim data absensi

**Request Body:**
```json
{
    "nama": "Hurrcane",
    "nis": "244119927",
    "nisn": "000000000000",
    "kelas": "XI SIJA 2",
    "password": "password123"
}
```

**Response (Success):**
```json
{
    "status": "success",
    "message": "Selamat datang Hurrcane! Absensi berhasil dicatat.",
    "siswa": {...},
    "waktu": "2025-10-12 16:30:00"
}
```

**Response (Rejected):**
```json
{
    "status": "rejected",
    "message": "Data tidak valid. Hubungi admin.",
    "errors": ["Password salah"],
    "waktu": "2025-10-12 16:30:00"
}
```

### 2. GET /api/kehadiran
Ambil data kehadiran dengan filter

**Query Parameters:**
- `tanggal` (optional) - Format: YYYY-MM-DD
- `kelas` (optional) - Filter by kelas
- `status` (optional) - hadir/ditolak
- `limit` (optional) - Default: 100

**Example:**
```
GET /api/kehadiran?tanggal=2025-10-12&kelas=XI SIJA 2&limit=50
```

### 3. POST /api/update_status
Update status kehadiran (Admin)

**Request Body:**
```json
{
    "id": 123,
    "status": "hadir",
    "alasan": "Diperbaiki oleh admin"
}
```

### 4. GET /api/debug
Debug endpoint untuk cek data dan koneksi database

## 🔧 Admin Panel

Akses: **http://localhost:5000/admin**

Fitur:
- ✅ Lihat semua kehadiran hari ini
- ✅ Update status kehadiran (hadir/ditolak)
- ✅ Statistik real-time
- ✅ Filter by tanggal, kelas, status

## 🔒 Catatan Keamanan

⚠️ **Server ini HANYA untuk backend dan admin panel**
- Dashboard client/siswa ada di folder `testing/`
- Tidak ada route `/` atau `/test` di sini
- ESP32 hanya perlu akses ke `/api/absensi`

## 🐛 Troubleshooting

### ESP32 tidak bisa connect
1. Pastikan ESP32 dan server di network yang sama
2. Cek IP server: `ipconfig` (Windows) atau `ifconfig` (Linux/Mac)
3. Test dengan curl:
   ```bash
   curl -X POST http://YOUR_IP:5000/api/absensi \
     -H "Content-Type: application/json" \
     -d '{"nama":"Test","nis":"123","nisn":"456","kelas":"XI","password":"test"}'
   ```

### Database error
1. Cek file `.env` ada dan berisi credentials Supabase yang benar
2. Test koneksi: `GET http://localhost:5000/api/debug`
