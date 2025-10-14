from flask import Flask, request, jsonify, render_template, url_for
from datetime import datetime
from database import get_supabase_client
import os
import json
from pathlib import Path


# Initialize Flask app
app = Flask(__name__)

# Initialize Supabase client
supabase = get_supabase_client()
DATA_FILE = Path("pending_absensi.json")

class AbsensiWebServer:
    def __init__(self, client):
        self.client = client
        self.siswa_table = "siswa"
        self.kehadiran_table = "kehadiran"

    def validate_siswa(self, nama, nis, nisn, kelas, password):
        """Validasi data siswa dari ESP32"""
        try:
            result = self.client.table(self.siswa_table).select("*").eq("nis", nis).execute()

            if not result.data:
                return False, None, ["NIS tidak ditemukan dalam database"]

            siswa = result.data[0]
            errors = []

            if siswa['nama'].lower() != nama.lower():
                errors.append("Nama tidak sesuai")

            if siswa['nisn'] != nisn:
                errors.append("NISN tidak sesuai")

            if siswa['kelas'].lower() != kelas.lower():
                errors.append("Kelas tidak sesuai")

            if siswa['password'] != password:
                errors.append("Password salah")

            if errors:
                return False, siswa, errors

            return True, siswa, []

        except Exception as e:
            return False, None, [f"Error database: {str(e)}"]

    def catat_kehadiran(self, nama, nis, nisn, kelas, password):
        """Catat kehadiran siswa"""
        is_valid, siswa_data, errors = self.validate_siswa(nama, nis, nisn, kelas, password)

        kehadiran_data = {
            "nama": nama,
            "nis": nis,
            "nisn": nisn,
            "kelas": kelas,
            "password_input": password,
            "waktu_absen": datetime.now().isoformat()
        }

        if is_valid:
            kehadiran_data.update({
                "siswa_id": siswa_data['id'],
                "status": "hadir",
                "alasan_ditolak": None
            })

            try:
                self.client.table(self.kehadiran_table).insert(kehadiran_data).execute()
                return {
                    "status": "success",
                    "message": f"Selamat datang {nama}! Absensi berhasil dicatat.",
                    "siswa": siswa_data,
                    "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": "Terjadi kesalahan sistem",
                    "error": str(e)
                }
        else:
            kehadiran_data.update({
                "siswa_id": siswa_data['id'] if siswa_data else None,
                "status": "ditolak",
                "alasan_ditolak": "; ".join(errors)
            })

            try:
                self.client.table(self.kehadiran_table).insert(kehadiran_data).execute()
                return {
                    "status": "rejected",
                    "message": "Data tidak valid. Hubungi admin.",
                    "errors": errors,
                    "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": "Terjadi kesalahan sistem",
                    "error": str(e)
                }

    def get_kehadiran(self, tanggal=None, kelas=None, status=None, limit=100):
        """Ambil data kehadiran dengan filter"""
        try:
            query = self.client.table(self.kehadiran_table).select("*")

            if tanggal:
                query = query.gte("waktu_absen", f"{tanggal} 00:00:00").lte("waktu_absen", f"{tanggal} 23:59:59")

            if kelas:
                query = query.eq("kelas", kelas)

            if status:
                query = query.eq("status", status)

            result = query.order("waktu_absen", desc=True).limit(limit).execute()
            return result.data

        except Exception as e:
            print(f"Error mengambil data kehadiran: {e}")
            return []

    def get_stats_kehadiran(self, tanggal=None):
        """Ambil statistik kehadiran"""
        try:
            query = self.client.table(self.kehadiran_table).select("status")

            if tanggal:
                start_time = f"{tanggal} 00:00:00"
                end_time = f"{tanggal} 23:59:59"
                query = query.gte("waktu_absen", start_time).lte("waktu_absen", end_time)

            result = query.execute()
            data = result.data

            total = len(data)
            hadir = len([x for x in data if x['status'] == 'hadir'])
            ditolak = len([x for x in data if x['status'] == 'ditolak'])

            stats = {
                "total": total,
                "hadir": hadir,
                "ditolak": ditolak,
                "persentase_hadir": round((hadir / total * 100) if total > 0 else 0, 1)
            }
            return stats

        except Exception as e:
            print(f"Error get_stats_kehadiran: {e}")
            return {"total": 0, "hadir": 0, "ditolak": 0, "persentase_hadir": 0}

    def get_siswa_stats(self):
        """Ambil statistik per siswa"""
        try:
            siswa_result = self.client.table(self.siswa_table).select("*").execute()
            if not siswa_result.data:
                return []

            stats = []
            for siswa in siswa_result.data:
                kehadiran_result = self.client.table(self.kehadiran_table) \
                    .select("status, waktu_absen") \
                    .eq("nis", siswa['nis']) \
                    .execute()

                kehadiran_data = kehadiran_result.data if kehadiran_result.data else []

                total_absensi = len(kehadiran_data)
                total_hadir = len([x for x in kehadiran_data if x['status'] == 'hadir'])
                total_ditolak = len([x for x in kehadiran_data if x['status'] == 'ditolak'])

                persentase_kehadiran = round((total_hadir / total_absensi * 100) if total_absensi > 0 else 0, 2)
                absensi_terakhir = max([x['waktu_absen'] for x in kehadiran_data], default=None)

                stats.append({
                    'nama': siswa['nama'],
                    'nis': siswa['nis'],
                    'kelas': siswa['kelas'],
                    'total_absensi': total_absensi,
                    'total_hadir': total_hadir,
                    'total_ditolak': total_ditolak,
                    'persentase_kehadiran': persentase_kehadiran,
                    'absensi_terakhir': absensi_terakhir
                })

            stats.sort(key=lambda x: x['total_ditolak'], reverse=True)
            return stats

        except Exception as e:
            print(f"Error mengambil stats siswa: {e}")
            return []

    def update_kehadiran_status(self, kehadiran_id, new_status, alasan=None):
        """Update status kehadiran secara manual"""
        try:
            update_data = {
                "status": new_status,
                "updated_at": datetime.now().isoformat()
            }

            if new_status == "ditolak" and alasan:
                update_data["alasan_ditolak"] = f"Diubah manual oleh admin: {alasan}"
            elif new_status == "hadir":
                update_data["alasan_ditolak"] = None

            self.client.table(self.kehadiran_table).update(update_data).eq("id", kehadiran_id).execute()
            return True, "Status berhasil diupdate"

        except Exception as e:
            return False, f"Error update status: {str(e)}"


# Initialize absensi system
absensi_system = AbsensiWebServer(supabase)

# ===============================
# API ENDPOINTS
# ===============================
@app.route('/api/absensi', methods=['POST'])
def api_absensi():
    """Endpoint untuk ESP32 kirim data absensi"""
    try:
        data = request.get_json()
        nama = data.get('nama', '').strip()
        nis = data.get('nis', '').strip()
        nisn = data.get('nisn', '').strip()
        kelas = data.get('kelas', '').strip()
        password = data.get('password', '').strip()

        if not all([nama, nis, nisn, kelas, password]):
            return jsonify({
                "status": "error",
                "message": "Data tidak lengkap"
            }), 400

        result = absensi_system.catat_kehadiran(nama, nis, nisn, kelas, password)
        status_code = 200 if result['status'] == 'success' else 400
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Server error",
            "error": str(e)
        }), 500


@app.route('/api/kehadiran')
def api_kehadiran():
    """API untuk ambil data kehadiran"""
    tanggal = request.args.get('tanggal')  # Format: YYYY-MM-DD
    kelas = request.args.get('kelas')
    status = request.args.get('status')  # hadir/ditolak
    limit = int(request.args.get('limit', 100))

    data = absensi_system.get_kehadiran(tanggal, kelas, status, limit)
    return jsonify(data)


@app.route('/api/update_status', methods=['POST'])
def api_update_status():
    """API untuk update status kehadiran"""
    try:
        # log request masuk
        print(">>> /api/update_status dipanggil")

        data = request.get_json(silent=True)
        print("Payload diterima:", data)

        if not data:
            return jsonify({"error": "Payload harus JSON"}), 400

        kehadiran_id = data.get('id')
        new_status = data.get('status')  # 'hadir' atau 'ditolak'
        alasan = data.get('alasan', '')

        if not kehadiran_id or not new_status:
            return jsonify({"error": "ID dan status harus diisi"}), 400

        if new_status not in ['hadir', 'ditolak']:
            return jsonify({"error": "Status harus 'hadir' atau 'ditolak'"}), 400

        success, message = absensi_system.update_kehadiran_status(
            kehadiran_id, new_status, alasan
        )

        if success:
            return jsonify({"message": message}), 200
        else:
            return jsonify({"error": message}), 500

    except Exception as e:
        # log error ke terminal
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@app.route('/api/debug')
def api_debug():
    """Debug endpoint untuk cek data"""
    try:
        siswa_count = len(absensi_system.client.table("siswa").select("id").execute().data)
        kehadiran_count = len(absensi_system.client.table("kehadiran").select("id").execute().data)

        tanggal_hari_ini = datetime.now().strftime("%Y-%m-%d")
        kehadiran_hari_ini = absensi_system.get_kehadiran(tanggal=tanggal_hari_ini)

        sample_siswa = absensi_system.client.table("siswa").select("*").limit(3).execute().data
        sample_kehadiran = absensi_system.client.table("kehadiran").select("*").limit(3).execute().data
        
        # Get unique kelas to see format
        all_kehadiran = absensi_system.client.table("kehadiran").select("kelas").limit(100).execute().data
        unique_kelas = list(set([item['kelas'] for item in all_kehadiran if item.get('kelas')]))

        return jsonify({
            "siswa_count": siswa_count,
            "kehadiran_count": kehadiran_count,
            "kehadiran_hari_ini_count": len(kehadiran_hari_ini),
            "sample_siswa": sample_siswa,
            "sample_kehadiran": sample_kehadiran,
            "tanggal_hari_ini": tanggal_hari_ini,
            "unique_kelas_formats": unique_kelas
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/kehadiran_by_jurusan')
def api_kehadiran_by_jurusan():
    """API untuk ambil data kehadiran per jurusan"""
    try:
        jurusan = request.args.get('jurusan', '').upper()
        tanggal = request.args.get('tanggal')
        limit = int(request.args.get('limit', 500))
        
        if not jurusan:
            return jsonify({"error": "Parameter jurusan diperlukan"}), 400
        
        # Get all siswa for this jurusan
        siswa_result = absensi_system.client.table(absensi_system.siswa_table).select("*").execute()
        siswa_list = [s for s in siswa_result.data if jurusan in s.get('kelas', '').upper()]
        
        # Query kehadiran berdasarkan jurusan (dari kelas siswa)
        query = absensi_system.client.table(absensi_system.kehadiran_table).select("*")
        
        # Filter tanggal jika ada
        if tanggal:
            query = query.gte("waktu_absen", f"{tanggal} 00:00:00").lte("waktu_absen", f"{tanggal} 23:59:59")
        
        result = query.order("waktu_absen", desc=True).limit(limit).execute()
        
        print(f"[DEBUG] Jurusan: {jurusan}, Total data fetched: {len(result.data)}")
        
        # Filter berdasarkan jurusan dari kelas (misalnya "TKL 1" -> "TKL" atau "SIJA 2" -> "SIJA")
        # Coba berbagai format: "SIJA", "SIJA 1", "XI SIJA 1", dll
        filtered_data = []
        for item in result.data:
            kelas = item.get('kelas', '').upper()
            # Check if jurusan is in the kelas string
            if jurusan in kelas or kelas.startswith(jurusan):
                filtered_data.append(item)
        
        print(f"[DEBUG] Filtered data count: {len(filtered_data)}")
        if len(filtered_data) > 0:
            print(f"[DEBUG] Sample kelas: {filtered_data[0].get('kelas')}")
        
        return jsonify({
            "kehadiran": filtered_data,
            "siswa": siswa_list
        })
        
    except Exception as e:
        print(f"[ERROR] api_kehadiran_by_jurusan: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/live_kehadiran')
def api_live_kehadiran():
    """API untuk live kehadiran - data terbaru real-time"""
    try:
        limit = int(request.args.get('limit', 50))
        
        # Ambil data kehadiran terbaru
        result = absensi_system.client.table(absensi_system.kehadiran_table) \
            .select("*") \
            .order("waktu_absen", desc=True) \
            .limit(limit) \
            .execute()
        
        return jsonify(result.data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/izin_siswa')
def api_izin_siswa():
    """API untuk ambil data pengajuan izin siswa"""
    try:
        # Cek apakah table izin ada, jika tidak gunakan kehadiran dengan status tertentu
        # Untuk sementara kita gunakan kehadiran dengan status 'ditolak' atau tambah status 'izin'
        
        # Jika ada tabel izin terpisah:
        # result = absensi_system.client.table("izin_siswa").select("*").order("created_at", desc=True).execute()
        
        # Untuk sementara gunakan data kehadiran dengan status ditolak sebagai contoh
        result = absensi_system.client.table(absensi_system.kehadiran_table) \
            .select("*") \
            .eq("status", "ditolak") \
            .order("waktu_absen", desc=True) \
            .limit(20) \
            .execute()
        
        return jsonify(result.data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# WEB DASHBOARD - ADMIN ONLY
# ===============================

@app.route('/')
def index():
    """Redirect ke admin panel"""
    return render_template('redirect_admin.html')


@app.route('/admin')
def admin_panel():
    """Admin panel untuk manage kehadiran"""
    tanggal_hari_ini = datetime.now().strftime("%Y-%m-%d")
    kehadiran_hari_ini = absensi_system.get_kehadiran(tanggal=tanggal_hari_ini, limit=200)
    stats_hari_ini = absensi_system.get_stats_kehadiran(tanggal=tanggal_hari_ini)

    return render_template(
        'dashboard_admin.html',
        tanggal_hari_ini=tanggal_hari_ini,
        kehadiran_hari_ini=kehadiran_hari_ini,
        stats_hari_ini=stats_hari_ini
    )


if __name__ == '__main__':
    print("🚀 Starting Absensi Web Server...")
    print("=" * 50)
    print("🔧 Admin Panel: http://localhost:5000/admin")
    print("=" * 50)
    print("\n� API Endpoints untuk ESP32:")
    print("  POST http://localhost:5000/api/absensi")
    print("  GET  http://localhost:5000/api/kehadiran")
    print("  POST http://localhost:5000/api/update_status")
    print("  GET  http://localhost:5000/api/debug")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5000, debug=True)