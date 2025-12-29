// ============================================
// DIAGNOSE PROFILE LOADING ISSUE
// Run this in browser console while logged in
// ============================================

(async function diagnoseProfile() {
  console.clear();
  console.log('🔍 DIAGNOSING PROFILE LOADING ISSUE\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Check Supabase auth
  console.log('1️⃣ Checking Supabase Authentication...');
  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error) {
      console.error('❌ Auth error:', error);
      return;
    }
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    console.log('✅ Authenticated as:', user.email);
    console.log('   User ID:', user.id);
    console.log('');

    // Test 2: Fetch profile directly from Supabase
    console.log('2️⃣ Fetching profile directly from Supabase...');
    const { data: profile, error: profileError } = await window.supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      console.log('   Error code:', profileError.code);
      console.log('   Error message:', profileError.message);
      console.log('');
      console.log('🔧 POSSIBLE FIX:');
      console.log('   1. Check RLS policies in Supabase');
      console.log('   2. Verify user_id matches profile id');
      return;
    }

    if (!profile) {
      console.error('❌ No profile found');
      return;
    }

    console.log('✅ Profile fetched from database:');
    console.log('   Email:', profile.email);
    console.log('   Full Name:', profile.full_name || '❌ NOT SET');
    console.log('   Role:', profile.role || '❌ NOT SET');
    console.log('   Plan:', profile.subscription_plan || '❌ NOT SET');
    console.log('   Status:', profile.subscription_status || '❌ NOT SET');
    console.log('');

    // Test 3: Check Zustand auth store
    console.log('3️⃣ Checking Zustand Auth Store...');
    const authStorage = localStorage.getItem('auth-storage');
    
    if (!authStorage) {
      console.error('❌ No auth storage found in localStorage');
      console.log('');
      console.log('🔧 FIX: Run this command:');
      console.log('   localStorage.clear(); location.reload();');
      return;
    }

    const authData = JSON.parse(authStorage);
    console.log('✅ Auth storage found');
    console.log('   Authenticated:', authData.state?.isAuthenticated);
    console.log('   User email:', authData.state?.user?.email);
    console.log('   Profile loaded:', !!authData.state?.profile);
    
    if (authData.state?.profile) {
      console.log('   Profile name:', authData.state.profile.full_name || '❌ NOT SET');
      console.log('   Profile role:', authData.state.profile.role || '❌ NOT SET');
      console.log('   Profile plan:', authData.state.profile.subscription_plan || '❌ NOT SET');
    } else {
      console.error('   ❌ Profile is NULL in Zustand store!');
    }
    console.log('');

    // Test 4: Compare database vs store
    console.log('4️⃣ Comparing Database vs Local Store...');
    const storedProfile = authData.state?.profile;
    
    console.log('Database has:');
    console.log('   full_name:', profile.full_name);
    console.log('   role:', profile.role);
    console.log('   subscription_plan:', profile.subscription_plan);
    console.log('');
    console.log('Store has:');
    console.log('   full_name:', storedProfile?.full_name);
    console.log('   role:', storedProfile?.role);
    console.log('   subscription_plan:', storedProfile?.subscription_plan);
    console.log('');

    // Check for mismatch
    if (
      profile.full_name !== storedProfile?.full_name ||
      profile.role !== storedProfile?.role ||
      profile.subscription_plan !== storedProfile?.subscription_plan
    ) {
      console.error('❌ MISMATCH DETECTED!');
      console.log('   Database and local store are out of sync!');
      console.log('');
      console.log('🔧 FIX: Clear cache and reload profile');
      console.log('   Run: forceReloadProfile() (see below)');
    } else {
      console.log('✅ Database and store match');
    }
    console.log('');

    // Test 5: Solution
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DIAGNOSIS COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (!storedProfile || !storedProfile.role || !storedProfile.full_name) {
      console.log('❌ PROBLEM FOUND:');
      console.log('   Local storage has incomplete profile data');
      console.log('');
      console.log('✅ SOLUTION:');
      console.log('   Run this function to reload profile:');
      console.log('');
      console.log('   forceReloadProfile()');
      console.log('');
      
      // Define helper function
      window.forceReloadProfile = async function() {
        console.log('🔄 Forcing profile reload...');
        
        // Clear storage
        localStorage.removeItem('auth-storage');
        
        // Reload profile
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
          console.error('Not authenticated');
          return;
        }
        
        const { data: freshProfile } = await window.supabase
          .from('users_profile')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('✅ Fresh profile loaded:', freshProfile);
        console.log('');
        console.log('Now reload the page:');
        console.log('   location.reload()');
      };
      
      console.log('Helper function added: forceReloadProfile()');
    } else {
      console.log('✅ Everything looks good!');
      console.log('   Profile data is correct in local storage');
      console.log('');
      console.log('If UI still shows email instead of name:');
      console.log('   1. Hard refresh: Cmd+Shift+R');
      console.log('   2. Or close browser completely and reopen');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
})();
