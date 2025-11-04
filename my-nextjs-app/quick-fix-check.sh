#!/bin/bash
# Quick Fix Script untuk memeriksa dan memperbaiki import issues

echo "🔍 Checking import issues in collectDATA.jsx..."

# Check current import in collectDATA.jsx
echo "Current import in collectDATA.jsx:"
head -n 1 c:/coding/github/absensi-RFID/my-nextjs-app/src/components/collectDATA.jsx

echo ""
echo "🔍 Checking exports in supabase.js..."

# Check exports in supabase.js
echo "Available exports in supabase.js:"
grep -n "export" c:/coding/github/absensi-RFID/my-nextjs-app/src/lib/supabase.js | head -n 5

echo ""
echo "✅ Fix Applied:"
echo "- Changed import from 'supabaseClient' to 'supabase'"
echo "- Updated all references in collectDATA.jsx"
echo ""
echo "📝 Next Steps:"
echo "1. Setup .env.local with your Supabase credentials"
echo "2. Create database tables using SETUP_SUPABASE.md"
echo "3. Test the application"