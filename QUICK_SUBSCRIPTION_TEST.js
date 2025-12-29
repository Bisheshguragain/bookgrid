/**
 * QUICK SUBSCRIPTION TEST
 * 
 * 1. Open your app at /app/dashboard
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Share the output with me
 */

(async function testSubscription() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SUBSCRIPTION DIAGNOSTIC TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Check if we're on the dashboard
  console.log('1️⃣ Current Page:', window.location.pathname);
  
  // Test 2: Check for subscription banner in DOM
  console.log('\n2️⃣ Looking for subscription banner in DOM...');
  const banners = document.querySelectorAll('[class*="gradient"]');
  console.log(`Found ${banners.length} gradient elements`);
  
  const subscriptionText = Array.from(document.querySelectorAll('*')).find(
    el => el.textContent?.includes('Free Plan') || 
          el.textContent?.includes('Pro Plan') ||
          el.textContent?.includes('Business Plan')
  );
  
  if (subscriptionText) {
    console.log('✅ Found subscription plan text in DOM:', subscriptionText.textContent);
  } else {
    console.log('❌ No subscription plan text found in DOM');
  }

  // Test 3: Get user ID from localStorage
  console.log('\n3️⃣ Getting user ID from session...');
  let userId = null;
  
  try {
    // Try to get from Supabase session
    const sessionKeys = Object.keys(localStorage).filter(k => k.includes('auth-token'));
    if (sessionKeys.length > 0) {
      const session = JSON.parse(localStorage.getItem(sessionKeys[0]));
      userId = session?.user?.id;
      console.log('✅ User ID from session:', userId);
      console.log('✅ User email:', session?.user?.email);
    } else {
      console.log('❌ No auth session found in localStorage');
    }
  } catch (error) {
    console.error('❌ Error getting session:', error);
  }

  if (!userId) {
    console.log('\n⚠️  Cannot proceed without user ID');
    console.log('Please make sure you are logged in!');
    return;
  }

  // Test 4: Direct Supabase query for user profile
  console.log('\n4️⃣ Fetching user profile from Supabase...');
  
  try {
    // Create Supabase client
    const SUPABASE_URL = 'https://hktabtbkxokotkvhpwlj.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdGFidGJreG9rb3Rrdmhwd2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNTc3MzAsImV4cCI6MjA1MDkzMzczMH0.dL-b6xkMu1jfg1O2gQxSB_HFqGJz5m3qO_s2vHnAFHk';
    
    // Note: Using fetch instead of supabase client for clearer debugging
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users_profile?id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile response:', profileData);
    
    if (profileData && profileData.length > 0) {
      const profile = profileData[0];
      console.log('📊 Subscription Plan:', profile.subscription_plan);
      console.log('📊 Subscription Status:', profile.subscription_status);
      console.log('📊 Bookings This Month:', profile.bookings_this_month);
      console.log('📊 Role:', profile.role);
      
      // Test 5: Fetch subscription plan details
      if (profile.subscription_plan) {
        console.log('\n5️⃣ Fetching subscription plan details...');
        
        const planResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/subscription_plans?name=eq.${profile.subscription_plan}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const planData = await planResponse.json();
        console.log('✅ Plan response:', planData);
        
        if (planData && planData.length > 0) {
          const plan = planData[0];
          console.log('📋 Plan Name:', plan.name);
          console.log('📋 Display Name:', plan.display_name);
          console.log('📋 Price Monthly:', plan.price_monthly);
          console.log('📋 Max Event Types:', plan.max_event_types);
          console.log('📋 Max Bookings/Month:', plan.max_bookings_per_month);
          console.log('📋 Features:', plan.features);
        } else {
          console.log('❌ No plan found with name:', profile.subscription_plan);
        }
      } else {
        console.log('❌ Profile has no subscription_plan set!');
      }
    } else {
      console.log('❌ No profile found for user:', userId);
    }
    
  } catch (error) {
    console.error('❌ Error fetching data:', error);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Please copy this entire output and share it!');
})();
