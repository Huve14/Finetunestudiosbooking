const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yqiktstghcnxglrcjyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWt0c3RnaGNueGdscmNqeWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDkxMDksImV4cCI6MjA4NTA4NTEwOX0.HST-SwwXDOtJ5uaPQ-1QK4fVTw8f5CzWEys2Diqp3ks';

// Use the service role key if available for admin operations
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupAdmin() {
  console.log('Setting up admin user...');
  
  try {
    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'huve@marketing2themax.co.za')
      .single();

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Try to insert the user with fallback auth method
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: 'huve@marketing2themax.co.za',
        password: 'Admin@123',
        name: 'Admin User',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      console.log('Insert error (expected if RLS is enabled):', insertError.message);
      console.log('\nTo complete setup, you need to:');
      console.log('1. Go to Supabase dashboard');
      console.log('2. Disable RLS on the "users" table temporarily');
      console.log('3. Or create a service role key and use this script with SUPABASE_SERVICE_ROLE_KEY env var');
      console.log('\nDemocredentials:');
      console.log('Email: huve@marketing2themax.co.za');
      console.log('Password: Admin@123');
      return;
    }

    console.log('Admin user created successfully:', insertData);

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupAdmin();
