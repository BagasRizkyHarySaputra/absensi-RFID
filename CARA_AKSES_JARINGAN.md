# 🌐 Cara Mengakses Dashboard dari Jaringan Lokal

## Langkah 1: Jalankan Server

### Untuk Dashboard Siswa:
```bash
cd pengguna
python test_dashboard.py
```

### Untuk Admin Panel:
```bash
cd developer
python app.py
```

## Langkah 2: Cari IP Address Komputer Server

### Windows (PowerShell/CMD):
```bash
ipconfig
```
Cari bagian **IPv4 Address** dari koneksi WiFi/LAN Anda, contoh: `192.168.1.100`

### Linux/Mac:
```bash
ifconfig
```
atau
```bash
ip addr show
```

## Langkah 3: Akses dari Device Lain

Pastikan **semua perangkat terhubung ke WiFi/jaringan yang sama**.

### Dashboard Siswa (Port 5001):
```
http://192.168.1.100:5001/login
```

### Admin Panel (Port 5000):
```
http://192.168.1.100:5000/admin
```

**Ganti `192.168.1.100` dengan IP address komputer server Anda!**

## Troubleshooting

### Tidak bisa diakses dari device lain?

1. **Cek Firewall Windows:**
   - Buka Windows Defender Firewall
   - Klik "Allow an app through firewall"
   - Pastikan Python diizinkan untuk Private dan Public networks

2. **Cek apakah server berjalan:**
   - Pastikan muncul pesan: `Running on http://0.0.0.0:5001`
   - Bukan `Running on http://127.0.0.1:5001`

3. **Cek koneksi jaringan:**
   - Pastikan semua device di WiFi yang sama
   - Coba ping IP server dari device lain

4. **Restart server:**
   - Stop server (Ctrl+C)
   - Jalankan ulang dengan perintah di atas

## Akses dari HP/Tablet

1. Buka browser di HP (Chrome, Safari, dll)
2. Ketik IP address + port, contoh:
   ```
   http://192.168.1.100:5001/login
   ```
3. Login dengan kredensial Anda
4. Dashboard akan menyesuaikan dengan orientasi layar HP

## Contoh IP Address

Biasanya IP address komputer di jaringan lokal seperti:
- `192.168.0.x` (router TP-Link, D-Link)
- `192.168.1.x` (router umum)
- `192.168.100.x` (IndiHome)
- `10.0.0.x` (beberapa router modern)

Di mana `x` adalah nomor unik untuk device Anda (1-254).

## Port yang Digunakan

- **5001** = Dashboard Siswa (login & dashboard)
- **5000** = Admin Panel + API ESP32

## Keamanan

⚠️ **PENTING:**
- Server ini hanya untuk jaringan lokal (tidak terhubung internet)
- Jangan expose port ini ke internet public
- Gunakan di lingkungan sekolah/rumah yang terpercaya
- Ganti `app.secret_key` di production

## Testing Kredensial

**Dashboard Siswa:**
- Nama: hurrcane (case insensitive)
- NIS: 244119927
