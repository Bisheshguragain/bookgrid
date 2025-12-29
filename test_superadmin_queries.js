/**
 * Test SuperAdmin Queries
 * This script tests all superadmin queries to identify what's failing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfwhzqnbogdavgusqogz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2h6cW5ib2dkYXZndXNxb2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjU4NjAsImV4cCI6MjA2MTAwMTg2MH0.K7EoRpLxYEQwVwX6PpfhrcRAXZ_L7evKCMbJr5gR9A8';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 TESTING SUPERADMIN QUERIES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testQueries() {
  try {
    // 1. Get current session
    console.log('1️⃣  Testing Auth Session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session. Please log in first.');
      return;
    }
    
    console.log('✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
    });
    console.log();

    // 2. Check if user is superadmin
    console.log('2️⃣  Testing SuperAdmin Check...');
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('role, subscription_plan, subscription_status, email, full_name')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile Error:', profileError);
      return;
    }
    
    console.log('✅ Profile loaded:', profile);
    
    if (profile.role !== 'superadmin') {
      console.error('❌ User is not a superadmin. Role:', profile.role);
      return;
    }
    console.log('✅ User is superadmin');
    console.log();

    // 3. Test MRR function
    console.log('3️⃣  Testing get_mrr() function...');
    const { data: mrrData, error: mrrError } = await supabase.rpc('get_mrr');
    
    if (mrrError) {
      console.error('❌ MRR Error:', mrrError);
    } else {
      console.log('✅ MRR Data:', mrrData);
    }
    console.log();

    // 4. Test user statistics function
    console.log('4️⃣  Testing get_user_statistics() function...');
    const { data: statsData, error: statsError } = await supabase.rpc('get_user_statistics');
    
    if (statsError) {
      console.error('❌ User Stats Error:', statsError);
    } else {
      console.log('✅ User Stats:', statsData);
    }
    console.log();

    // 5. Test revenue statistics function
    console.log('5️⃣  Testing get_revenue_statistics() function...');
    const { data: revenueData, error: revenueError } = await supabase.rpc('get_revenue_statistics');
    
    if (revenueError) {
      console.error('❌ Revenue Stats Error:', revenueError);
    } else {
      console.log('✅ Revenue Stats:', revenueData);
    }
    console.log();

    // 6. Test getAllUsers query
    console.log('6️⃣  Testing getAllUsers query...');
    const { data: usersData, error: usersError, count } = await supabase
      .from('users_profile')
      .select(`
        id,
        email,
        full_name,
        username,
        subscription_plan,
        subscription_status,
        role,
        account_status,
        last_active_at,
        deletion_notice_sent_at,
        scheduled_deletion_at,
        created_at,
        bookings_this_month
      `, { count: 'exact' })
      .range(0, 49)
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Users Query Error:', usersError);
    } else {
      console.log('✅ Users Query Result:', {
        count: count,
        firstUser: usersData?.[0],
        totalReturned: usersData?.length,
      });
    }
    console.log();

    // 7. Test payment_history table
    console.log('7️⃣  Testing payment_history query...');
    const { data: paymentsData, error: paymentsError, count: paymentsCount } = await supabase
      .from('payment_history')
      .select('*', { count: 'exact' })
      .range(0, 49)
      .order('created_at', { ascending: false });
    
    if (paymentsError) {
      console.error('❌ Payments Query Error:', paymentsError);
    } else {
      console.log('✅ Payments Query Result:', {
        count: paymentsCount,
        firstPayment: paymentsData?.[0],
        totalReturned: paymentsData?.length,
      });
    }
    console.log();

    // 8. Test inactive users function
    console.log('8️⃣  Testing get_inactive_users() function...');
    const { data: inactiveData, error: inactiveError } = await supabase.rpc('get_inactive_users', {
      days_threshold: 90,
    });
    
    if (inactiveError) {
      console.error('❌ Inactive Users Error:', inactiveError);
    } else {
      console.log('✅ Inactive Users:', {
        count: inactiveData?.length,
        firstUser: inactiveData?.[0],
      });
    }
    console.log();

    // 9. Test account_deletion_notices table
    console.log('9️⃣  Testing account_deletion_notices query...');
    const { data: deletionsData, error: deletionsError } = await supabase
      .from('account_deletion_notices')
      .select('*')
      .eq('notice_status', 'sent')
      .order('created_at', { ascending: false });
    
    if (deletionsError) {
      console.error('❌ Deletions Query Error:', deletionsError);
    } else {
      console.log('✅ Deletions Query Result:', {
        count: deletionsData?.length,
        firstNotice: deletionsData?.[0],
      });
    }
    console.log();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error);
  }
}

testQueries();
