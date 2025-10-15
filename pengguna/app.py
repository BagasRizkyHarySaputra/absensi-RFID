"""
Test Dashboard untuk Supabase Integration
Testing dashboard dengan data dari database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from database import get_supabase_client
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get absolute path to parent directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')  # Static di folder pengguna
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')

app = Flask(__name__, 
            template_folder=TEMPLATE_DIR,
            static_folder=STATIC_DIR)

# Secret key untuk session - gunakan environment variable
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Konfigurasi untuk testing
TEST_NIS = "244119927"  # NIS: Hurrcane, XI SIJA 2

def validate_login(nama, nis):
    """
    Validasi login dengan nama dan NIS (case-insensitive untuk nama)
    
    Args:
        nama: Nama siswa (akan diubah ke uppercase)
        nis: NIS siswa
    
    Returns:
        Siswa data jika valid, None jika tidak valid
    """
    try:
        print(f"[DEBUG] validate_login called - nama: {nama}, nis: {nis}")
        client = get_supabase_client()
        
        # Ambil semua siswa dengan NIS yang cocok
        result = client.table("siswa")\
            .select("*")\
            .eq("nis", nis)\
            .execute()
        
        print(f"[DEBUG] Supabase query result: {result.data}")
        
        if not result.data:
            print("[DEBUG] No data found for NIS")
            return None
        
        # Cek apakah ada siswa dengan nama yang cocok (case-insensitive)
        nama_upper = nama.strip().upper()
        print(f"[DEBUG] Searching for nama_upper: {nama_upper}")
        
        for siswa in result.data:
            siswa_nama_upper = siswa['nama'].strip().upper()
            print(f"[DEBUG] Comparing with: {siswa_nama_upper}")
            if siswa_nama_upper == nama_upper:
                print(f"[DEBUG] Match found! Returning siswa: {siswa}")
                return siswa
        
        print("[DEBUG] No matching nama found")
        return None
    
    except Exception as e:
        print(f"[ERROR] validate_login exception: {e}")
        import traceback
        traceback.print_exc()
        return None

def get_siswa_data(nis):
    """Get data siswa dari database"""
    try:
        client = get_supabase_client()
        result = client.table("siswa")\
            .select("*")\
            .eq("nis", nis)\
            .execute()
        
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error get siswa: {e}")
        return None

def get_history_data(nis, limit=10):
    """Get history kehadiran dari database"""
    try:
        client = get_supabase_client()
        result = client.table("kehadiran")\
            .select("*")\
            .eq("nis", nis)\
            .order("waktu_absen", desc=True)\
            .limit(limit)\
            .execute()
        
        return result.data
    except Exception as e:
        print(f"Error get history: {e}")
        return []

def format_history(history_data):
    """Format history data untuk display"""
    formatted = []
    
    # Nama hari dalam bahasa Indonesia
    hari_indonesia = {
        0: 'Senin',
        1: 'Selasa', 
        2: 'Rabu',
        3: 'Kamis',
        4: 'Jumat',
        5: 'Sabtu',
        6: 'Minggu'
    }
    
    for record in history_data:
        try:
            # Parse waktu_absen
            waktu = datetime.fromisoformat(record['waktu_absen'].replace('Z', '+00:00'))
            
            # Get hari
            hari = hari_indonesia[waktu.weekday()]
            tanggal = waktu.strftime('%d/%m/%Y')
            
            # Tentukan status
            if record['status'] == 'hadir':
                status_class = 'success'
                message = 'Berhasil melakukan presensi'
                icon = '✅'
            else:
                status_class = 'failed'
                alasan = record.get('alasan_ditolak', 'Alasan tidak diketahui')
                message = f'Gagal presensi - {alasan}'
                icon = '❌'
            
            formatted.append({
                'time': waktu.strftime('%H.%M'),
                'day': hari,
                'date': tanggal,
                'message': message,
                'icon': icon,
                'status_class': status_class
            })
        except Exception as e:
            print(f"Error format record: {e}")
            continue
    
    return formatted

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Route untuk login"""
    if request.method == 'POST':
        nama = request.form.get('nama', '').strip()
        nis = request.form.get('nis', '').strip()
        
        # Debug logging
        print(f"[DEBUG] Login attempt - Nama: {nama}, NIS: {nis}")
        
        # Validasi input
        if not nama or not nis:
            print("[DEBUG] Login failed - Empty nama or NIS")
            return render_template('login.html', error='Nama dan NIS harus diisi!')
        
        # Validasi dengan database
        siswa = validate_login(nama, nis)
        
        if siswa:
            print(f"[DEBUG] Login success - Siswa: {siswa}")
            # Simpan data siswa ke session
            session['siswa_id'] = siswa['id']
            session['nama'] = siswa['nama']
            session['nis'] = siswa['nis']
            session['kelas'] = siswa['kelas']
            
            return redirect(url_for('dashboard'))
        else:
            print(f"[DEBUG] Login failed - validate_login returned None")
            return render_template('login.html', error='Nama atau NIS tidak cocok! Pastikan data yang Anda masukkan benar.')
    
    # GET request - tampilkan form login
    return render_template('login.html', error=None)

@app.route('/logout')
def logout():
    """Route untuk logout"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def dashboard():
    """Route dashboard dengan auto-detect orientation"""
    
    # Cek apakah user sudah login
    if 'siswa_id' not in session:
        return redirect(url_for('login'))
    
    # Get data dari session
    nama = session.get('nama')
    kelas = session.get('kelas')
    nis = session.get('nis')
    
    # Get history
    history_raw = get_history_data(nis, limit=10)
    history = format_history(history_raw)
    
    # Render halaman detection yang akan redirect otomatis
    return render_template('dashboard_detector.html',
                         nama=nama,
                         kelas=kelas,
                         nis=nis,
                         history=history)

@app.route('/landscape')
def dashboard_landscape():
    """Route untuk dashboard landscape (16:9)"""
    
    # Cek apakah user sudah login
    if 'siswa_id' not in session:
        return redirect(url_for('login'))
    
    # Get data dari session
    nama = session.get('nama')
    kelas = session.get('kelas')
    nis = session.get('nis')
    
    # Get history
    history_raw = get_history_data(nis, limit=10)
    history = format_history(history_raw)
    
    return render_template('dashboard_landscape.html',
                         nama=nama,
                         kelas=kelas,
                         nis=nis,
                         history=history)

@app.route('/potrait')
def dashboard_potrait():
    """Route untuk dashboard potrait (9:16)"""
    
    # Cek apakah user sudah login
    if 'siswa_id' not in session:
        return redirect(url_for('login'))
    
    # Get data dari session
    nama = session.get('nama')
    kelas = session.get('kelas')
    nis = session.get('nis')
    
    # Get history
    history_raw = get_history_data(nis, limit=10)
    history = format_history(history_raw)
    
    return render_template('dashboard_potrait.html',
                         nama=nama,
                         kelas=kelas,
                         nis=nis,
                         history=history)

@app.route('/api/history/<nis>')
def api_history(nis):
    """API endpoint untuk get history by NIS"""
    history_raw = get_history_data(nis, limit=10)
    history = format_history(history_raw)
    return jsonify({
        'success': True,
        'data': history,
        'count': len(history)
    })

@app.route('/test-connection')
def test_connection():
    """Test koneksi Supabase"""
    try:
        client = get_supabase_client()
        return jsonify({
            'success': True,
            'message': 'Koneksi Supabase berhasil!'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Dashboard System dengan Auto-Detection")
    print("=" * 60)
    print("\nRoutes:")
    print("  - http://localhost:5001/login      : Login Page")
    print("  - http://localhost:5001/           : Dashboard (auto-detect)")
    print("  - http://localhost:5001/landscape  : Dashboard Landscape (16:9)")
    print("  - http://localhost:5001/potrait    : Dashboard Potrait (9:16)")
    print("  - http://localhost:5001/logout     : Logout")
    print("\nAPI Routes:")
    print("  - http://localhost:5001/api/history/<nis>")
    print("  - http://localhost:5001/test-connection")
    print("\n" + "=" * 60)
    print("TESTING CREDENTIALS:")
    print("  Nama: hurrcane (case insensitive)")
    print("  NIS: 244119927")
    print("=" * 60)
    print("\n💡 Sistem akan otomatis mendeteksi resolusi layar:")
    print("   - Potrait (9:16 atau height > width) → dashboard_potrait")
    print("   - Landscape (16:9 atau width >= height) → dashboard_landscape")
    print("=" * 60)
    print("\n🌐 Server dapat diakses dari jaringan lokal!")
    print("   Gunakan IP Address komputer ini untuk akses dari device lain")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
