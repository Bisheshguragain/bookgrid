/**
 * BROWSER CONSOLE DIAGNOSTIC SCRIPT
 * 
 * Copy and paste this into your browser console (F12) while on the dashboard
 * to diagnose subscription and superadmin issues
 */

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DASHBOARD DIAGNOSTIC CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check 1: Auth Store State
console.log('1️⃣ Checking Auth Store...');
const authStore = window.__ZUSTAND__?.authStore || null;
if (authStore) {
  console.log('✅ Auth Store found');
  console.log('User:', authStore.user);
  console.log('Profile:', authStore.profile);
  console.log('Is SuperAdmin:', authStore.profile?.role === 'superadmin');
} else {
  console.log('❌ Auth Store not found');
}
console.log('');

// Check 2: Current Route
console.log('2️⃣ Current Route:', window.location.pathname);
console.log('');

// Check 3: Check if on dashboard
if (window.location.pathname.includes('/app/dashboard')) {
  console.log('3️⃣ On Dashboard - Checking for subscription banner...');
  const banner = document.querySelector('[class*="gradient"]');
  if (banner) {
    console.log('✅ Found gradient banner');
  } else {
    console.log('❌ No gradient banner found');
  }
} else {
  console.log('3️⃣ Not on dashboard, navigate there first');
}
console.log('');

// Check 4: Test Supabase connection and fetch user profile
console.log('4️⃣ Testing Supabase connection...');
(async () => {
  try {
    // Get supabase instance from window (if exposed) or recreate
    const { createClient } = window.supabase || {};
    
    if (!createClient) {
      console.log('❌ Supabase not available in window. Trying alternative...');
      
      // Alternative: Try to find the session
      const session = localStorage.getItem('sb-hktabtbkxokotkvhpwlj-auth-token');
      if (session) {
        console.log('✅ Found session in localStorage');
        const parsed = JSON.parse(session);
        console.log('Session user:', parsed?.user?.email);
      } else {
        console.log('❌ No session found in localStorage');
      }
      return;
    }

    // If we have access to createClient, test the connection
    console.log('✅ Testing queries...');
    
  } catch (error) {
    console.error('❌ Error testing Supabase:', error);
  }
})();

console.log('');

// Check 5: Profile dropdown and SuperAdmin link
console.log('5️⃣ Checking Profile Dropdown...');
setTimeout(() => {
  const profileButton = document.querySelector('button[class*="flex items-center space-x-3"]');
  if (profileButton) {
    console.log('✅ Profile button found');
    console.log('Click it and look for "🔐 SuperAdmin Dashboard" link');
    
    // Try to find the dropdown menu
    const dropdown = document.querySelector('[class*="absolute right-0 mt-2 w-48"]');
    if (dropdown) {
      console.log('✅ Dropdown menu found (already open)');
      const superadminLink = Array.from(dropdown.querySelectorAll('a')).find(
        a => a.textContent?.includes('SuperAdmin')
      );
      if (superadminLink) {
        console.log('✅ SuperAdmin link found in dropdown!');
        console.log('Link href:', superadminLink.getAttribute('href'));
      } else {
        console.log('❌ SuperAdmin link NOT found in dropdown');
        console.log('Available links:', Array.from(dropdown.querySelectorAll('a')).map(a => a.textContent));
      }
    } else {
      console.log('⚠️  Dropdown not open. Click the profile button to open it.');
    }
  } else {
    console.log('❌ Profile button not found');
  }
}, 500);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 DIAGNOSTIC COMPLETE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('NEXT STEPS:');
console.log('1. Copy the output above');
console.log('2. If on dashboard, check if you see a subscription banner');
console.log('3. Click your profile picture/name in the top right');
console.log('4. Look for "🔐 SuperAdmin Dashboard" in the dropdown');
console.log('5. Click it and see what happens');
console.log('6. Copy any errors that appear in console');
console.log('');
