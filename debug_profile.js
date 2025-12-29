// SuperAdmin Profile Debug Tool
// Run this in browser console (F12) to check if your profile has the role field

// Method 1: Check current profile in auth store
const checkProfile = async () => {
  // Get from localStorage
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    console.log('=== PROFILE FROM STORAGE ===');
    console.log('User:', parsed.state?.user?.email);
    console.log('Profile:', parsed.state?.profile);
    console.log('Role:', parsed.state?.profile?.role);
    console.log('Has role field:', 'role' in (parsed.state?.profile || {}));
  }

  // Get from Supabase directly
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log('\n=== PROFILE FROM SUPABASE ===');
    const { data, error } = await supabase
      .from('users_profile')
      .select('id, email, full_name, role, account_status, subscription_plan')
      .eq('id', user.id)
      .single();
    
    console.log('Query result:', { data, error });
    console.log('Has role:', data?.role);
  }
};

// Method 2: Force reload profile
const reloadProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      // Update localStorage
      const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      authStorage.state.profile = data;
      localStorage.setItem('auth-storage', JSON.stringify(authStorage));
      
      console.log('✅ Profile reloaded!');
      console.log('Role:', data.role);
      console.log('Please refresh the page.');
      return data;
    } else {
      console.error('❌ Error loading profile:', error);
    }
  }
};

// Method 3: Clear and re-fetch
const resetAuth = async () => {
  console.log('Clearing auth storage and reloading...');
  localStorage.removeItem('auth-storage');
  window.location.reload();
};

// Run the check
console.log('=== SUPERADMIN PROFILE DEBUG ===\n');
await checkProfile();

console.log('\n=== AVAILABLE COMMANDS ===');
console.log('checkProfile() - Check current profile');
console.log('reloadProfile() - Force reload profile from database');
console.log('resetAuth() - Clear storage and reload page');
console.log('\nTry: await reloadProfile()');
