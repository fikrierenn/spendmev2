import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const SupabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBudgets = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Direct query without RLS
      addResult('Testing direct budget query...');
      const { data: directData, error: directError } = await supabase
        .from('spendme_budgets')
        .select('*')
        .limit(5);

      if (directError) {
        addResult(`Direct query error: ${directError.message}`);
      } else {
        addResult(`Direct query success: ${directData?.length || 0} budgets found`);
      }

      // Test 2: Service role query
      addResult('Testing service role query...');
      if (!process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY) {
        addResult('Service role key not configured');
        return;
      }
      
      const supabaseService = createClient(
        process.env.REACT_APP_SUPABASE_URL!,
        process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: serviceData, error: serviceError } = await supabaseService
        .from('spendme_budgets')
        .select('*')
        .limit(5);

      if (serviceError) {
        addResult(`Service role error: ${serviceError.message}`);
      } else {
        addResult(`Service role success: ${serviceData?.length || 0} budgets found`);
        if (serviceData && serviceData.length > 0) {
          addResult(`Sample budget: ${JSON.stringify(serviceData[0], null, 2)}`);
        }
      }

      // Test 3: Test with specific user ID and period
      addResult('Testing with specific user ID and period...');
      const testUserId = 'b5318971-add4-48ba-85fb-b856f2bd22ca';
      const testPeriod = '2025-06';
      
      const { data: userData, error: userError } = await supabaseService
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', testUserId)
        .eq('period', testPeriod)
        .limit(5);

      if (userError) {
        addResult(`User query error: ${userError.message}`);
      } else {
        addResult(`User query success: ${userData?.length || 0} budgets found for user ${testUserId} and period ${testPeriod}`);
        if (userData && userData.length > 0) {
          addResult(`Sample budget: ${JSON.stringify(userData[0], null, 2)}`);
        }
      }

      if (userError) {
        addResult(`User query error: ${userError.message}`);
      } else {
        addResult(`User query success: ${userData?.length || 0} budgets found for user`);
      }

      // Test 4: Test categories
      addResult('Testing categories...');
      const { data: categoriesData, error: categoriesError } = await supabaseService
        .from('spendme_categories')
        .select('*')
        .eq('user_id', testUserId)
        .limit(5);

      if (categoriesError) {
        addResult(`Categories error: ${categoriesError.message}`);
      } else {
        addResult(`Categories success: ${categoriesData?.length || 0} categories found`);
      }

    } catch (error) {
      addResult(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Budget Test</h1>
      
      <button
        onClick={testBudgets}
        disabled={loading}
        className="btn-primary mb-4"
      >
        {loading ? 'Testing...' : 'Test Budgets'}
      </button>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        <div className="space-y-1">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm font-mono bg-white p-2 rounded">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest; 