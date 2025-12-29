// ============================================
// ONE-CLICK FIX - Copy and paste this ENTIRE script
// into your browser console (F12 → Console tab)
// ============================================

(async function oneClickFix() {
  console.clear();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 ONE-CLICK PROFILE FIX');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Get current user
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Not authenticated');
      console.log('   Please sign in first, then run this script again.');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('');

    // Step 2: Fetch fresh profile from database
    console.log('2️⃣ Fetching fresh profile from database...');
    const { data: freshProfile, error: profileError } = await window.supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    console.log('✅ Fresh profile loaded:');
    console.log('   Name:', freshProfile.full_name || '❌ NOT SET');
    console.log('   Role:', freshProfile.role || '❌ NOT SET');
    console.log('   Plan:', freshProfile.subscription_plan || '❌ NOT SET');
    console.log('   Status:', freshProfile.subscription_status || '❌ NOT SET');
    console.log('');

    // Step 3: Update Zustand store with fresh data
    console.log('3️⃣ Updating local storage with fresh data...');
    
    const authStorage = {
      state: {
        user: user,
        profile: freshProfile,
        isAuthenticated: true,
        loading: false,
      },
      version: 0,
    };
    
    localStorage.setItem('auth-storage', JSON.stringify(authStorage));
    console.log('✅ Local storage updated');
    console.log('');

    // Step 4: Verify the update
    console.log('4️⃣ Verifying update...');
    const verified = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    
    if (verified.state?.profile?.full_name === freshProfile.full_name &&
        verified.state?.profile?.role === freshProfile.role) {
      console.log('✅ Verification passed!');
    } else {
      console.error('❌ Verification failed');
      console.log('   Stored data does not match fresh data');
    }
    console.log('');

    // Step 5: Instructions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FIX APPLIED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 NEXT STEPS:');
    console.log('1. Reload the page (Cmd+R or F5)');
    console.log('2. Check profile shows: "' + freshProfile.full_name + '"');
    
    if (freshProfile.role === 'superadmin') {
      console.log('3. Check for "🔐 SuperAdmin" badge in profile dropdown');
      console.log('4. Check for "SuperAdmin Dashboard" link');
    }
    
    console.log('\n🎯 Reloading page in 3 seconds...\n');
    
    // Auto-reload after 3 seconds
    setTimeout(() => {
      location.reload();
    }, 3000);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('\n🆘 If this didn\'t work:');
    console.log('1. Try signing out and signing in again');
    console.log('2. Clear all browser data and try again');
    console.log('3. Check URGENT_FIX_PROFILE.md for more options');
  }
})();
