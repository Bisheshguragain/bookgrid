// ============================================
// BROWSER CONSOLE TEST SCRIPT
// Copy and paste this into your browser console (F12)
// while logged in to BookGrid
// ============================================

(async function testBookGridSetup() {
  console.log('🔍 Starting BookGrid SuperAdmin Setup Verification...\n');

  // Test 1: Check Supabase connection
  console.log('1️⃣ Testing Supabase Connection...');
  try {
    const { data, error } = await window.supabase.from('users_profile').select('count');
    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (e) {
    console.error('❌ Error accessing Supabase:', e);
  }

  // Test 2: Check current user authentication
  console.log('\n2️⃣ Testing User Authentication...');
  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error || !user) {
      console.error('❌ Not authenticated:', error);
    } else {
      console.log('✅ Authenticated as:', user.email);
      console.log('   User ID:', user.id);
    }
  } catch (e) {
    console.error('❌ Error getting user:', e);
  }

  // Test 3: Check user profile
  console.log('\n3️⃣ Testing User Profile...');
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await window.supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
      } else if (!profile) {
        console.error('❌ No profile found');
      } else {
        console.log('✅ Profile loaded:');
        console.log('   Full Name:', profile.full_name || '❌ NOT SET');
        console.log('   Email:', profile.email);
        console.log('   Role:', profile.role || 'user');
        console.log('   Plan:', profile.subscription_plan || 'free');
        console.log('   Status:', profile.subscription_status || 'active');
        console.log('   Is SuperAdmin:', profile.role === 'superadmin' ? '✅ YES' : '❌ NO');
      }
    }
  } catch (e) {
    console.error('❌ Error loading profile:', e);
  }

  // Test 4: Check SuperAdmin access
  console.log('\n4️⃣ Testing SuperAdmin Access...');
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
      const { data: profile } = await window.supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'superadmin') {
        // Try to fetch all users (should work for superadmin)
        const { data: users, error } = await window.supabase
          .from('users_profile')
          .select('id, email, full_name, role, subscription_plan')
          .limit(5);

        if (error) {
          console.error('❌ Cannot fetch users:', error);
        } else {
          console.log('✅ SuperAdmin access confirmed');
          console.log(`   Can see ${users?.length || 0} users`);
        }
      } else {
        console.log('⚠️  Not a superadmin (role:', profile?.role || 'user', ')');
      }
    }
  } catch (e) {
    console.error('❌ Error testing superadmin access:', e);
  }

  // Test 5: Check Zustand store
  console.log('\n5️⃣ Testing Zustand Auth Store...');
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      console.log('✅ Auth store found:');
      console.log('   Authenticated:', authData.state?.isAuthenticated || false);
      console.log('   Profile loaded:', !!authData.state?.profile);
      console.log('   Profile name:', authData.state?.profile?.full_name || '❌ NOT SET');
      console.log('   Role:', authData.state?.profile?.role || 'user');
    } else {
      console.warn('⚠️  No auth storage found');
    }
  } catch (e) {
    console.error('❌ Error reading auth storage:', e);
  }

  // Test 6: Test RLS policies
  console.log('\n6️⃣ Testing RLS Policies...');
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
      // Test select
      const { error: selectError } = await window.supabase
        .from('users_profile')
        .select('id')
        .eq('id', user.id)
        .single();

      // Test update
      const { error: updateError } = await window.supabase
        .from('users_profile')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (selectError) {
        console.error('❌ SELECT permission denied:', selectError);
      } else {
        console.log('✅ SELECT permission OK');
      }

      if (updateError) {
        console.error('❌ UPDATE permission denied:', updateError);
      } else {
        console.log('✅ UPDATE permission OK');
      }
    }
  } catch (e) {
    console.error('❌ Error testing RLS:', e);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION COMPLETE');
  console.log('='.repeat(50));
  console.log('\nIf you see any ❌ errors above:');
  console.log('1. Run verify_superadmin_setup.sql in Supabase');
  console.log('2. Ensure role=superadmin in database');
  console.log('3. Clear browser cache and sign in again');
  console.log('4. Check SUPERADMIN_TROUBLESHOOTING.md');
  console.log('\nFor detailed help, see FINAL_VERIFICATION_CHECKLIST.md');
})();
