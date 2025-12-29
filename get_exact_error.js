// ============================================
// GET EXACT 500 ERROR DETAILS
// Run this in browser console to see the real error
// ============================================

(async function getExactError() {
  console.clear();
  console.log('🔍 Fetching exact error details...\n');

  try {
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Not authenticated:', userError);
      return;
    }

    console.log('✅ User ID:', user.id);
    console.log('✅ Email:', user.email);
    console.log('');

    // Try to fetch profile with detailed error logging
    console.log('Attempting to fetch profile...');
    const { data, error } = await window.supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERROR DETAILS:');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('');
      
      if (error.message) {
        console.log('📋 DIAGNOSIS:');
        if (error.message.includes('policy')) {
          console.log('   → RLS policy is blocking access');
          console.log('   → Run: nuclear_rls_reset.sql in Supabase');
        } else if (error.message.includes('permission')) {
          console.log('   → Permission denied');
          console.log('   → Check RLS policies in Supabase');
        } else if (error.code === 'PGRST116') {
          console.log('   → No rows returned (profile doesn\'t exist)');
          console.log('   → Need to create profile for this user');
        } else {
          console.log('   → Unknown error');
          console.log('   → Check Supabase logs for details');
        }
      }
    } else if (data) {
      console.log('✅ SUCCESS! Profile loaded:');
      console.log(data);
    } else {
      console.log('⚠️  No error but also no data');
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
})();
