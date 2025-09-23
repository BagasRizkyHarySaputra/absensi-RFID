from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"URL: {url}")
print(f"Key: {key[:20]}...") # Hanya tampilkan 20 karakter pertama

try:
    supabase: Client = create_client(url, key)
    print("✅ Koneksi Supabase berhasil!")
    
    # Test query sederhana
    result = supabase.table('siswa').select("count", count="exact").execute()
    print(f"📊 Jumlah siswa dalam database: {result.count}")
    
except Exception as e:
    print(f"❌ Error koneksi: {e}")