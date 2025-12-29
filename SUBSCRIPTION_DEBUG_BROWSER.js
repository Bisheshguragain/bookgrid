/**
 * SUBSCRIPTION DEBUG - Run this in browser console on /app/dashboard
 * 
 * This will show us exactly what's happening with the subscription fetch
 */

(async function debugSubscription() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SUBSCRIPTION DEBUG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get user ID from session
  const sessionKeys = Object.keys(localStorage).filter(k => k.includes('auth-token'));
  if (sessionKeys.length === 0) {
    console.log('❌ Not logged in!');
    return;
  }
  
  const session = JSON.parse(localStorage.getItem(sessionKeys[0]));
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  
  console.log('✅ User ID:', userId);
  console.log('✅ User Email:', userEmail);
  
  // Supabase config
  const SUPABASE_URL = 'https://hktabtbkxokotkvhpwlj.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdGFidGJreG9rb3Rrdmhwd2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNTc3MzAsImV4cCI6MjA1MDkzMzczMH0.dL-b6xkMu1jfg1O2gQxSB_HFqGJz5m3qO_s2vHnAFHk';
  
  console.log('\n1️⃣ Fetching user profile...');
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users_profile?id=eq.${userId}`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const profiles = await profileRes.json();
  console.log('Profile response:', profiles);
  
  if (!profiles || profiles.length === 0) {
    console.log('❌ No profile found!');
    return;
  }
  
  const profile = profiles[0];
  console.log('✅ Profile subscription_plan:', profile.subscription_plan);
  console.log('✅ Profile subscription_status:', profile.subscription_status);
  console.log('✅ Profile bookings_this_month:', profile.bookings_this_month);
  
  console.log('\n2️⃣ Fetching subscription plan...');
  const planRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscription_plans?name=eq.${profile.subscription_plan || 'free'}`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const plans = await planRes.json();
  console.log('Plan response:', plans);
  
  if (!plans || plans.length === 0) {
    console.log('❌ No plan found for:', profile.subscription_plan);
    return;
  }
  
  const plan = plans[0];
  console.log('✅ Plan name:', plan.name);
  console.log('✅ Plan display_name:', plan.display_name);
  console.log('✅ Plan max_event_types:', plan.max_event_types);
  console.log('✅ Plan max_bookings_per_month:', plan.max_bookings_per_month);
  console.log('✅ Plan features:', plan.features);
  
  console.log('\n3️⃣ Counting event types...');
  const eventTypesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/event_types?user_id=eq.${userId}&is_active=eq.true&select=*`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    }
  );
  
  const eventTypes = await eventTypesRes.json();
  const eventTypeCount = eventTypes.length;
  console.log('✅ Active event types:', eventTypeCount);
  
  console.log('\n4️⃣ Building subscription object...');
  const subscription = {
    plan: profile.subscription_plan,
    status: profile.subscription_status,
    features: plan.features,
    limits: {
      max_event_types: plan.max_event_types,
      max_bookings_per_month: plan.max_bookings_per_month,
      current_event_types: eventTypeCount,
      current_bookings_this_month: profile.bookings_this_month || 0,
    },
    can_create_event_type: plan.max_event_types === -1 || eventTypeCount < plan.max_event_types,
    can_create_booking: plan.max_bookings_per_month === null || plan.max_bookings_per_month === -1 || (profile.bookings_this_month || 0) < plan.max_bookings_per_month,
  };
  
  console.log('\n✅ FINAL SUBSCRIPTION OBJECT:');
  console.log(JSON.stringify(subscription, null, 2));
  
  console.log('\n5️⃣ Checking DOM for subscription banner...');
  const banner = Array.from(document.querySelectorAll('*')).find(
    el => el.textContent?.includes('Business Plan') || 
          el.textContent?.includes('Pro Plan') ||
          el.textContent?.includes('Free Plan')
  );
  
  if (banner) {
    console.log('✅ Subscription banner FOUND in DOM');
  } else {
    console.log('❌ Subscription banner NOT FOUND in DOM');
    console.log('⚠️  This means React state is not updating correctly!');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DIAGNOSIS COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!banner) {
    console.log('🔧 LIKELY ISSUE: The subscription data is in the database,');
    console.log('   but the Dashboard component is not fetching it or');
    console.log('   the React state is not being set.');
    console.log('\n💡 NEXT STEP: Check the browser console for any errors');
    console.log('   when the Dashboard loads, especially:');
    console.log('   - "Error getting user subscription"');
    console.log('   - Network errors (401, 403, 500)');
    console.log('   - "subscription is null"');
  }
})();
