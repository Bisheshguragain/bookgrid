import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

/**
 * Database Test Component
 * This component helps debug database connection and RLS policy issues
 * Add this to your app temporarily to test database operations
 */
export function DatabaseTest() {
  const { user } = useAuthStore();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `${emoji} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const runTests = async () => {
    if (!user) {
      addResult('No user logged in', 'error');
      return;
    }

    setLoading(true);
    clearResults();
    addResult('Starting database tests...', 'info');
    addResult(`User ID: ${user.id}`, 'info');

    // Test 1: Check event_types table structure
    try {
      addResult('Test 1: Checking event_types table structure...', 'info');
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        addResult(`Table has ${columns.length} columns`, 'success');
        
        // Check for new columns
        if (columns.includes('date_range_start')) {
          addResult('Column "date_range_start" exists', 'success');
        } else {
          addResult('Column "date_range_start" MISSING - migration needed', 'error');
        }
        
        if (columns.includes('date_range_end')) {
          addResult('Column "date_range_end" exists', 'success');
        } else {
          addResult('Column "date_range_end" MISSING - migration needed', 'error');
        }
      } else {
        addResult('No data in table yet (this is ok)', 'info');
      }
    } catch (err) {
      addResult(`Test 1 failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }

    // Test 2: Try to insert minimal event type
    try {
      addResult('Test 2: Attempting to insert minimal event type...', 'info');
      const { data, error } = await supabase
        .from('event_types')
        .insert({
          user_id: user.id,
          title: 'Test Event Type',
          duration: 30,
        })
        .select()
        .single();

      if (error) throw error;

      addResult('Successfully inserted event type!', 'success');
      addResult(`Event ID: ${data.id}`, 'info');

      // Clean up - delete the test event
      const { error: deleteError } = await supabase
        .from('event_types')
        .delete()
        .eq('id', data.id);

      if (deleteError) throw deleteError;
      addResult('Test event cleaned up', 'success');
    } catch (err) {
      addResult(`Test 2 failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      
      // Check for specific error types
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg.includes('row-level security')) {
        addResult('RLS policy issue detected! Run fix-rls-policies.sql', 'error');
      } else if (errorMsg.includes('column') && errorMsg.includes('does not exist')) {
        addResult('Missing column! Run migrations/001_add_new_features.sql', 'error');
      } else if (errorMsg.includes('violates check constraint')) {
        addResult('Data validation issue - check your values', 'error');
      }
    }

    // Test 3: Try all new location types
    const locationTypes = ['zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person', 'webex', 'skype', 'custom'];
    
    for (const locationType of locationTypes) {
      try {
        addResult(`Test 3.${locationTypes.indexOf(locationType) + 1}: Testing location type "${locationType}"...`, 'info');
        
        const { data, error } = await supabase
          .from('event_types')
          .insert({
            user_id: user.id,
            title: `Test ${locationType}`,
            duration: 30,
            location_type: locationType,
          })
          .select()
          .single();

        if (error) throw error;

        // Clean up
        await supabase.from('event_types').delete().eq('id', data.id);
        
        addResult(`Location type "${locationType}" works!`, 'success');
      } catch (err) {
        addResult(`Location type "${locationType}" failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }

    // Test 4: Try availability rules
    try {
      addResult('Test 4: Attempting to insert availability rule...', 'info');
      const { data, error } = await supabase
        .from('availability_rules')
        .insert({
          user_id: user.id,
          day_of_week: 1,
          start_time: '09:00:00',
          end_time: '17:00:00',
          buffer_before: 0,
          buffer_after: 0,
        })
        .select()
        .single();

      if (error) throw error;

      addResult('Successfully inserted availability rule!', 'success');

      // Clean up
      await supabase.from('availability_rules').delete().eq('id', data.id);
      addResult('Test availability rule cleaned up', 'success');
    } catch (err) {
      addResult(`Test 4 failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg.includes('row-level security')) {
        addResult('RLS policy issue for availability_rules! Run fix-rls-policies.sql', 'error');
      }
    }

    // Test 5: Check Supabase connection
    try {
      addResult('Test 5: Checking Supabase connection...', 'info');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        addResult('Supabase session is valid', 'success');
        addResult(`Session expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`, 'info');
      } else {
        addResult('No session found - you may need to log in again', 'error');
      }
    } catch (err) {
      addResult(`Test 5 failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }

    setLoading(false);
    addResult('All tests completed!', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Connection Test</h1>
          <p className="mt-1 text-sm text-gray-600">
            Run these tests to diagnose database and RLS policy issues
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={runTests}
            disabled={loading || !user}
            className="btn-primary"
          >
            {loading ? 'Running Tests...' : 'Run Tests'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Results
          </button>
        </div>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ You must be logged in to run database tests
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Test Results:</h2>
            <div className="space-y-1 font-mono text-xs">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`${
                    result.startsWith('✅')
                      ? 'text-green-700'
                      : result.startsWith('❌')
                      ? 'text-red-700'
                      : 'text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to fix issues:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>If RLS policy errors appear, run <code className="bg-blue-100 px-1 rounded">fix-rls-policies.sql</code> in Supabase SQL Editor</li>
            <li>If column errors appear, run <code className="bg-blue-100 px-1 rounded">migrations/001_add_new_features.sql</code> in Supabase SQL Editor</li>
            <li>Check <code className="bg-blue-100 px-1 rounded">DATABASE_FIX_GUIDE.md</code> for detailed instructions</li>
            <li>Verify Supabase credentials in <code className="bg-blue-100 px-1 rounded">.env</code> file</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
