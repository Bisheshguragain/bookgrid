// ============================================
// FORCE REFRESH PROFILE - Run in Browser Console
// This will clear all cache and reload profile
// ============================================

(async function forceRefreshProfile() {
  console.log('🔄 Starting forced profile refresh...\n');

  // Step 1: Clear all storage
  console.log('1️⃣ Clearing all storage...');
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Storage cleared\n');

  // Step 2: Sign out
  console.log('2️⃣ Signing out...');
  try {
    await window.supabase.auth.signOut();
    console.log('✅ Signed out\n');
  } catch (e) {
    console.log('⚠️  Already signed out\n');
  }

  // Step 3: Wait a moment
  console.log('3️⃣ Waiting for cleanup...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ Ready\n');

  // Step 4: Instructions
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CACHE CLEARED SUCCESSFULLY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Close this browser tab');
  console.log('2. Close the entire browser');
  console.log('3. Reopen browser');
  console.log('4. Go to BookGrid');
  console.log('5. Sign in with: bishesh.guragain@gmail.com');
  console.log('\n⚠️  DO NOT just refresh - CLOSE THE BROWSER!\n');

  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
})();
