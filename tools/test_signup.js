const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yqiktstghcnxglrcjyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWt0c3RnaGNueGdscmNqeWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDkxMDksImV4cCI6MjA4NTA4NTEwOX0.HST-SwwXDOtJ5uaPQ-1QK4fVTw8f5CzWEys2Diqp3ks';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'Test@1234';
  const name = 'Automated Test';
  const phone = '0000000000';

  console.log('Signing up user:', email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } }
  });

  if (authError) {
    console.error('Auth signup error:', authError.message || authError);
  } else {
    console.log('Auth signup success, user id:', authData?.user?.id);
  }

  // Wait a moment for any DB hooks to run
  await new Promise(r => setTimeout(r, 1500));

  console.log('Querying users table for', email);
  const { data: userRow, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (usersError) console.error('Users table query error:', usersError.message || usersError);
  console.log('Users row:', userRow);

  console.log('Attempting to sign in with the new credentials...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) console.error('Sign in error:', signInError.message || signInError);
  else console.log('Sign in success, id:', signInData?.user?.id);

  console.log('Test complete. Note: cleanup not performed.');
}

main().catch(e => console.error('Test script error:', e));
