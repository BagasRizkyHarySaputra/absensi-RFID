/**
 * Database Configuration Validator
 * Pastikan semua akses database menggunakan environment variables
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Manually load .env.local since this is not a Next.js process
try {
  const envConfig = dotenv.parse(readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ .env.local loaded successfully');
} catch (error) {
  console.log('❌ Failed to load .env.local:', error.message);
}

import { supabase } from './src/lib/supabase.js';

// Fungsi untuk memvalidasi environment variables
export const validateEnvironmentConfig = () => {
  console.log('🔍 Validating Environment Configuration...\n');
  
  const errors = [];
  const warnings = [];
  
  // 1. Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    errors.push('❌ NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local');
  } else if (!supabaseUrl.includes('.supabase.co')) {
    warnings.push('⚠️ NEXT_PUBLIC_SUPABASE_URL format mungkin tidak valid');
  } else {
    console.log(`✅ SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
  }
  
  if (!supabaseKey) {
    errors.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di .env.local');
  } else if (!supabaseKey.startsWith('eyJ')) {
    warnings.push('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY format mungkin tidak valid (harus mulai dengan eyJ)');
  } else {
    console.log(`✅ SUPABASE_KEY: ${supabaseKey.substring(0, 30)}...`);
  }
  
  // 2. Check Supabase client initialization
  if (!supabase) {
    errors.push('❌ Supabase client tidak ter-inisialisasi');
  } else {
    console.log('✅ Supabase client berhasil dibuat');
  }
  
  // 3. Check for hardcoded credentials (this should be run manually)
  console.log('\n🔍 Tips untuk mencegah hardcoded credentials:');
  console.log('1. Jangan pernah commit file .env.local ke git');
  console.log('2. Gunakan import { supabase } from "./lib/supabase" di semua file');
  console.log('3. Jangan buat createClient() langsung di file lain');
  console.log('4. Restart development server setelah mengubah .env.local');
  
  // Print results
  console.log('\n📊 Validation Results:');
  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Semua konfigurasi environment variables sudah benar!');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      hasClient: !!supabase
    }
  };
};

// Fungsi untuk test koneksi database
export const testDatabaseConnection = async () => {
  console.log('\n🔗 Testing Database Connection...\n');
  
  try {
    if (!supabase) {
      throw new Error('Supabase client tidak tersedia');
    }
    
    // Test sederhana - ambil count dari tabel
    const { data, error, count } = await supabase
      .from('pengajuan_izin')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Database connection berhasil!');
    console.log(`📊 Tabel pengajuan_izin memiliki ${count || 0} records`);
    
    return { success: true, count };
    
  } catch (error) {
    console.log('❌ Database connection gagal:');
    console.log(`   Error: ${error.message}`);
    
    // Berikan saran berdasarkan jenis error
    if (error.message?.includes('permission denied') || 
        error.message?.includes('row-level security policy')) {
      console.log('\n💡 Solusi: Masalah Row Level Security (RLS)');
      console.log('   - Nonaktifkan RLS di Supabase Dashboard');
      console.log('   - Atau buat RLS policy yang tepat');
    } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.log('\n💡 Solusi: Tabel belum dibuat');
      console.log('   - Buat tabel pengajuan_izin di Supabase Dashboard');
    }
    
    return { success: false, error: error.message };
  }
};

// Main validation function
export const runFullValidation = async () => {
  console.log('🚀 Running Full Database Configuration Validation\n');
  console.log('='.repeat(60));
  
  // Step 1: Validate environment
  const envValidation = validateEnvironmentConfig();
  
  // Step 2: Test database connection
  let dbValidation = null;
  if (envValidation.isValid) {
    dbValidation = await testDatabaseConnection();
  } else {
    console.log('\n⏭️ Skipping database test due to environment errors');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY REPORT');
  console.log('='.repeat(60));
  
  console.log(`Environment Config: ${envValidation.isValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Database Connection: ${dbValidation?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (envValidation.isValid && dbValidation?.success) {
    console.log('\n🎉 Semua konfigurasi database sudah benar!');
    console.log('   Aplikasi siap digunakan dengan database Supabase.');
  } else {
    console.log('\n🔧 Ada masalah yang perlu diperbaiki.');
    console.log('   Ikuti saran di atas untuk menyelesaikan masalah.');
  }
  
  return {
    environment: envValidation,
    database: dbValidation,
    overall: envValidation.isValid && dbValidation?.success
  };
};

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullValidation();
}