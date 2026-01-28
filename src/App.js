import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://yqiktstghcnxglrcjyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWt0c3RnaGNueGdscmNqeWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDkxMDksImV4cCI6MjA4NTA4NTEwOX0.HST-SwwXDOtJ5uaPQ-1QK4fVTw8f5CzWEys2Diqp3ks';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// DATA
// ============================================================
const studios = [
  {
    id: 'studio-a',
    name: 'Studio A - Recording Suite',
    description: 'Our flagship recording studio featuring state-of-the-art equipment perfect for professional music production.',
    capacity: 8,
    location: 'Main Building, Floor 2',
    image: '🎵',
    features: ['SSL Console', 'Neumann Microphones', 'Isolation Booth', 'Control Room'],
    hourlyRate: 1200
  },
  {
    id: 'studio-b',
    name: 'Studio B - Podcast Studio',
    description: 'Intimate space designed for podcasting, voice-overs, and spoken word recordings.',
    capacity: 4,
    location: 'Main Building, Floor 1',
    image: '🎙️',
    features: ['Shure SM7B Mics', 'Soundproofed', 'Video Setup', 'Live Streaming'],
    hourlyRate: 800
  },
  {
    id: 'studio-c',
    name: 'Studio C - Mix & Master',
    description: 'Dedicated mixing and mastering suite with acoustically treated environment.',
    capacity: 3,
    location: 'East Wing',
    image: '🎚️',
    features: ['Genelec Monitors', 'Pro Tools HDX', 'Analog Outboard', 'Mastering Chain'],
    hourlyRate: 1000
  },
  {
    id: 'studio-d',
    name: 'Studio D - Rehearsal Space',
    description: 'Spacious rehearsal room with full backline and PA system for band practice.',
    capacity: 10,
    location: 'Basement Level',
    image: '🎸',
    features: ['Full Backline', '4kW PA System', 'Drum Kit', 'Amps'],
    hourlyRate: 600
  }
];

const services = [
  { id: 'recording', name: 'Recording Session', duration: 120, price: 2400 },
  { id: 'mixing', name: 'Mixing', duration: 180, price: 3000 },
  { id: 'mastering', name: 'Mastering', duration: 60, price: 1000 },
  { id: 'podcast', name: 'Podcast Recording', duration: 90, price: 1200 },
  { id: 'rehearsal', name: 'Band Rehearsal', duration: 120, price: 1200 },
  { id: 'voiceover', name: 'Voice Over', duration: 60, price: 800 }
];

const availableSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// ============================================================
// DATABASE FUNCTIONS
// ============================================================
// Demo credentials for testing (in production, use Supabase Auth)
const DEMO_CREDENTIALS = {
  admin: {
    email: 'huve@marketing2themax.co.za',
    password: 'Admin@123',
    name: 'Admin User',
    id: 'admin-demo-001'
  }
};

async function loginUser(email, password, role) {
  try {
    console.log('Login attempt:', { email, role });

    // First check demo credentials for immediate testing
    if (role === 'admin' && DEMO_CREDENTIALS.admin) {
      const demoAdmin = DEMO_CREDENTIALS.admin;
      if (email === demoAdmin.email && password === demoAdmin.password) {
        console.log('Login successful with demo credentials');
        return {
          success: true,
          user: {
            id: demoAdmin.id,
            email: demoAdmin.email,
            name: demoAdmin.name,
            role: role
          }
        };
      }
    }

    // Try to authenticate using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Auth result:', { hasData: !!authData?.user, error: authError?.message });

    if (authError || !authData?.user) {
      console.log('Auth failed, trying custom users table');

      // Choose table based on requested role: public users stored in public_users
      const table = role === 'user' ? 'public_users' : 'users';
      const selectCols = role === 'user' ? 'id, email, name, role, is_active' : 'id, email, name, role, password, is_active';

      const { data, error } = await supabase
        .from(table)
        .select(selectCols)
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      console.log(`${table} query result:`, { found: !!data, error: error?.message });

      if (error || !data) {
        return { success: false, error: 'User not found. Please check your credentials.' };
      }

      // For admin (users table) verify password locally
      if (role !== 'user') {
        if (data.password !== password) {
          return { success: false, error: 'Invalid password' };
        }

        return {
          success: true,
          user: {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role
          }
        };
      }

      // For public users we rely on Supabase Auth for password checks; if auth failed, instruct reset
      return { success: false, error: 'Authentication failed. If you just signed up, check your email to confirm; otherwise use password reset.' };
    }

    // If Supabase Auth succeeds, get user profile by email (don't trust requested role)
    const profileTable = role === 'user' ? 'public_users' : 'users';
    const { data: userData, error: userError } = await supabase
      .from(profileTable)
      .select('id, email, name, role, is_active')
      .eq('email', email)
      .maybeSingle();

    console.log('User profile query result:', { found: !!userData, error: userError?.message });

    // If the caller requested admin access but the stored profile is not admin, deny access
    if (role === 'admin' && userData && userData.role !== 'admin') {
      return { success: false, error: 'Not authorized for admin portal.' };
    }

    // Build final user object from stored profile when available; otherwise default to 'user'
    const user = userData || {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name || email.split('@')[0],
      role: 'user'
    };

    // If user profile doesn't exist but auth succeeded, create a profile for regular users
    if (!userData && role === 'user') {
      console.log('Creating user profile in public_users table...');
      await supabase
        .from('public_users')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          phone: authData.user.user_metadata?.phone || '',
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();
    }

    console.log('Login successful with Supabase Auth');
    return { 
      success: true, 
      user
    };
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error messages
    let errorMessage = error.message || 'An error occurred during login';
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
    } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
      errorMessage = 'Invalid email or password.';
    }
    
    return { success: false, error: errorMessage };
  }
}

async function signupUser(email, password, name, phone) {
  try {
    console.log('Signup attempt:', { email, name });

    // Validate input
    if (!email || !password || !name || !phone) {
      return { success: false, error: 'All fields are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Check if user already exists in public_users (public signups should use public_users)
    const { data: existingUser } = await supabase
      .from('public_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'Email already registered. Please login instead.' };
    }

    // Try to create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          phone: phone
        }
      }
    });

    console.log('Auth signup result:', { hasData: !!authData?.user, error: authError?.message });

    if (authError) {
      let errorMessage = authError.message || 'An error occurred during signup';
      
      // Handle specific Supabase error messages
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorMessage.includes('email_rate_limit_exceeded')) {
        errorMessage = 'Too many signup attempts for this email. Please wait 1 hour before trying again, or use a different email address.';
      } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
        errorMessage = 'Invalid email or password format.';
      }
      
      return { success: false, error: errorMessage };
    }

    // Persist profile in 'public_users' table with the auth user id (preferred for public users)
    const supabaseUserId = authData?.user?.id;
    if (supabaseUserId) {
      console.log('Attempting to insert into public_users with id:', supabaseUserId);
      const { data: userData, error: userError } = await supabase
        .from('public_users')
        .insert([{
          id: supabaseUserId,
          email: email,
          name: name,
          phone: phone,
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (userError) {
        console.warn('public_users insert failed:', userError.message, userError);
        // fallback: try inserting into users table if necessary
        try {
          console.log('Attempting fallback insert into users table');
          const { error: fallbackErr } = await supabase
            .from('users')
            .insert([{
              id: supabaseUserId,
              email,
              name,
              phone,
              password: password,
              role: 'user',
              is_active: true,
              created_at: new Date().toISOString()
            }]);

          if (fallbackErr) {
            console.warn('users insert fallback failed:', fallbackErr.message);
          } else {
            console.log('Fallback insert to users succeeded');
          }
        } catch (e) {
          console.warn('users insert attempt threw:', e.message);
        }

        // Return success since auth succeeded; user profile will be created on first login
        console.log('Returning success despite profile insert failure - will create on login');
        return {
          success: true,
          user: {
            id: supabaseUserId,
            email,
            name,
            phone,
            role: 'user'
          }
        };
      }

      // If insert succeeded and returned a row, use it; otherwise fall back to auth id
      const finalUser = userData || { id: supabaseUserId, email, name, phone, role: 'user' };

      console.log('Signup successful, profile inserted:', finalUser);
      return {
        success: true,
        user: {
          id: finalUser.id,
          email: finalUser.email,
          name: finalUser.name,
          phone: finalUser.phone,
          role: finalUser.role || 'user'
        }
      };
    }

    // If for some reason auth didn't return an id, still return success (edge case)
    return {
      success: true,
      user: {
        id: null,
        email,
        name,
        phone,
        role: 'user'
      }
    };
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific error messages
    let errorMessage = error.message || 'An error occurred during signup';
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorMessage.includes('email_rate_limit_exceeded')) {
      errorMessage = 'Too many signup attempts for this email. Please wait 1 hour before trying again, or use a different email address.';
    } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
      errorMessage = 'This email is already registered. Please login instead.';
    }
    
    return { success: false, error: errorMessage };
  }
}

async function getAllBookings() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: error.message };
  }
}

async function getBookingsByDateAndStudio(date, studioId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date)
      .eq('studio_id', studioId)
      .in('status', ['confirmed', 'pending']);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: error.message };
  }
}

async function createBooking(bookingData) {
  try {
    // Get all bookings to generate booking number
    const { data: allBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id');
    
    if (fetchError) throw fetchError;
    
    const bookingNumber = `FTS-${new Date().getFullYear()}-${String((allBookings?.length || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ booking_number: bookingNumber, ...bookingData }])
      .select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// STYLES
// ============================================================
const colors = {
  red: '#dc2626',
  redHover: '#b91c1c',
  black: '#0a0a0a',
  white: '#ffffff',
  gray50: '#fafafa',
  gray100: '#f4f4f5',
  gray200: '#e4e4e7',
  gray300: '#d4d4d8',
  gray400: '#a1a1aa',
  gray500: '#71717a',
  gray600: '#52525b',
  gray800: '#27272a',
  gray900: '#18181b'
};

const styles = {
  // Global
  page: {
    minHeight: '100vh',
    backgroundColor: colors.white,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  
  // Navigation
  nav: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: colors.white
  },
  navLogoIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: colors.red,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  navLogoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '2px'
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center'
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: colors.white,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 0'
  },
  
  // Buttons
  btnPrimary: {
    backgroundColor: colors.red,
    color: colors.white,
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
  },
  btnSecondary: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  btnOutline: {
    backgroundColor: 'transparent',
    color: colors.gray600,
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    border: `2px solid ${colors.gray300}`,
    cursor: 'pointer',
    fontSize: '14px'
  },
  
  // Hero Section
  hero: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a0a0a 100%)',
    color: colors.white,
    padding: '100px 24px',
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: 'bold',
    marginBottom: '24px',
    letterSpacing: '3px',
    lineHeight: 1.2
  },
  heroSubtitle: {
    fontSize: '20px',
    color: colors.gray400,
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px'
  },
  
  // Sections
  section: {
    padding: '80px 24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  sectionGray: {
    backgroundColor: colors.gray50,
    padding: '80px 24px'
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16px',
    letterSpacing: '2px'
  },
  sectionSubtitle: {
    textAlign: 'center',
    color: colors.gray600,
    marginBottom: '48px',
    fontSize: '16px'
  },
  
  // Cards Grid
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  
  // Feature Card
  featureCard: {
    backgroundColor: colors.white,
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    borderTop: `4px solid ${colors.red}`,
    textAlign: 'center'
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 24px'
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  featureDesc: {
    color: colors.gray600,
    fontSize: '14px',
    lineHeight: 1.6
  },
  
  // Studio Card
  studioCard: {
    backgroundColor: colors.gray50,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    borderLeft: `4px solid ${colors.red}`,
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  studioImage: {
    height: '200px',
    background: 'linear-gradient(145deg, #1a1a1a 0%, #2d0a0a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px'
  },
  studioContent: {
    padding: '24px'
  },
  studioName: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '12px',
    letterSpacing: '1px'
  },
  studioDesc: {
    color: colors.gray600,
    marginBottom: '16px',
    fontSize: '14px',
    lineHeight: 1.6
  },
  studioFeatures: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  },
  studioFeatureTag: {
    padding: '4px 12px',
    backgroundColor: colors.gray200,
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.gray700
  },
  studioMeta: {
    display: 'flex',
    gap: '16px',
    color: colors.gray500,
    fontSize: '14px',
    marginBottom: '16px'
  },
  studioFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.gray200}`
  },
  studioPrice: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: colors.red
  },
  studioPriceUnit: {
    fontSize: '14px',
    color: colors.gray500
  },
  
  // Footer
  footer: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: '64px 24px 32px'
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '48px',
    maxWidth: '1200px',
    margin: '0 auto 48px'
  },
  footerTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.red,
    marginBottom: '16px',
    letterSpacing: '1px'
  },
  footerText: {
    color: colors.gray400,
    fontSize: '14px',
    lineHeight: 1.8
  },
  footerBottom: {
    borderTop: `1px solid ${colors.gray800}`,
    paddingTop: '32px',
    textAlign: 'center',
    color: colors.gray500,
    fontSize: '14px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  
  // Form
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '1px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: `2px solid ${colors.gray300}`,
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: `2px solid ${colors.gray300}`,
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '120px'
  },
  
  // Login
  loginContainer: {
    maxWidth: '400px',
    margin: '60px auto',
    padding: '0 24px'
  },
  loginCard: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    borderTop: `4px solid ${colors.red}`
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  loginIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: colors.red,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    margin: '0 auto 16px'
  },
  loginTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '2px'
  },
  loginSubtitle: {
    color: colors.gray600,
    marginTop: '8px'
  },
  
  // Alert
  alert: {
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid'
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
    color: '#166534'
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderColor: colors.red,
    color: '#991b1b'
  },
  alertInfo: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    color: '#1e40af'
  },
  
  // Booking Flow
  bookingContainer: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 24px'
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    borderTop: `4px solid ${colors.red}`,
    marginBottom: '24px'
  },
  bookingTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    letterSpacing: '2px'
  },
  
  // Progress Steps
  progressContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '48px',
    position: 'relative'
  },
  progressLine: {
    position: 'absolute',
    top: '20px',
    left: '40px',
    right: '40px',
    height: '4px',
    backgroundColor: colors.gray300,
    zIndex: 0
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1
  },
  progressCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '8px'
  },
  progressCircleActive: {
    backgroundColor: colors.red,
    color: colors.white
  },
  progressCircleInactive: {
    backgroundColor: colors.gray300,
    color: colors.gray600
  },
  progressLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  
  // Selection Cards
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  selectionCard: {
    padding: '20px',
    border: `2px solid ${colors.gray200}`,
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    backgroundColor: colors.white,
    transition: 'all 0.2s'
  },
  selectionCardActive: {
    borderColor: colors.red,
    backgroundColor: '#fef2f2'
  },
  selectionIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  selectionName: {
    fontWeight: 'bold',
    fontSize: '16px',
    letterSpacing: '1px'
  },
  selectionMeta: {
    fontSize: '12px',
    color: colors.gray500,
    marginTop: '4px'
  },
  selectionPrice: {
    color: colors.red,
    fontWeight: 'bold',
    fontSize: '18px',
    marginTop: '12px'
  },
  
  // Service List
  serviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  serviceCard: {
    padding: '20px',
    border: `2px solid ${colors.gray200}`,
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    transition: 'all 0.2s'
  },
  
  // Time Slots
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px'
  },
  timeSlot: {
    padding: '12px',
    border: `2px solid ${colors.gray200}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: colors.white,
    transition: 'all 0.2s'
  },
  timeSlotActive: {
    borderColor: colors.red,
    backgroundColor: '#fef2f2',
    color: colors.red
  },
  timeSlotBooked: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray300,
    color: colors.gray400,
    cursor: 'not-allowed',
    position: 'relative'
  },
  
  // Summary
  summaryBox: {
    backgroundColor: colors.gray50,
    padding: '24px',
    borderRadius: '12px',
    borderLeft: `4px solid ${colors.red}`,
    marginBottom: '24px'
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.red,
    marginBottom: '16px',
    letterSpacing: '1px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  summaryLabel: {
    color: colors.gray600,
    fontWeight: '600'
  },
  summaryValue: {
    fontWeight: 'bold'
  },
  summaryTotal: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: colors.red
  },
  
  // Navigation Buttons
  navButtons: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  
  // Dashboard
  dashboardHeader: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: '16px 24px',
    borderBottom: `4px solid ${colors.red}`
  },
  dashboardHeaderContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: colors.white,
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    borderTop: `4px solid ${colors.red}`
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '12px'
  },
  statLabel: {
    fontSize: '12px',
    color: colors.gray500,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '1px'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold'
  },
  
  // Table
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },
  tableTitle: {
    padding: '24px',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    borderBottom: `1px solid ${colors.gray200}`
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: colors.gray900,
    color: colors.white
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  td: {
    padding: '16px',
    borderBottom: `1px solid ${colors.gray200}`
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  statusPending: {
    backgroundColor: '#fef9c3',
    color: '#854d0e'
  },
  
  // Header for inner pages
  innerHeader: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: '16px 24px'
  },
  innerHeaderContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: colors.white,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  
  // CTA Section
  ctaSection: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a0a0a 100%)',
    color: colors.white,
    padding: '80px 24px',
    textAlign: 'center'
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: 'bold',
    marginBottom: '24px',
    letterSpacing: '2px'
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: colors.gray400,
    marginBottom: '40px'
  }
};

// ============================================================
// COMPONENTS
// ============================================================

// Navigation
const Navigation = ({ currentPage, isAuthenticated, userRole, onNavigate, onLogout }) => (
  <nav style={styles.nav}>
    <button style={styles.navLogo} onClick={() => onNavigate('home')}>
      <div style={styles.navLogoIcon}>🎵</div>
      <span style={styles.navLogoText}>FINETUNE STUDIOS</span>
    </button>
    <div style={styles.navLinks}>
      <button style={styles.navLink} onClick={() => onNavigate('home')}>Home</button>
      <button style={styles.navLink} onClick={() => onNavigate('studios')}>Studios</button>
      {isAuthenticated ? (
        <>
          {userRole === 'admin' && (
            <button style={styles.navLink} onClick={() => onNavigate('admin-dashboard')}>Dashboard</button>
          )}
          <button style={{...styles.btnOutline, color: colors.white, borderColor: colors.gray600}} onClick={onLogout}>Logout</button>
        </>
      ) : (
        <>
          <button style={styles.navLink} onClick={() => onNavigate('login-user')}>Login</button>
          <button style={{...styles.navLink, color: colors.red}} onClick={() => onNavigate('signup')}>Sign Up</button>
          <button style={{...styles.navLink, color: colors.red}} onClick={() => onNavigate('login-admin')}>Admin</button>
        </>
      )}
      <button style={styles.btnPrimary} onClick={() => onNavigate('book')}>Book Now</button>
    </div>
  </nav>
);

// Footer
const Footer = () => (
  <footer style={styles.footer}>
    <div style={styles.footerGrid}>
      <div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
          <div style={{...styles.navLogoIcon, width: '56px', height: '56px', fontSize: '28px'}}>🎵</div>
          <span style={{fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px'}}>FINETUNE STUDIOS</span>
        </div>
        <p style={styles.footerText}>
          Professional recording facilities in the heart of Bryanston, Sandton. 
          World-class equipment meets creative excellence.
        </p>
      </div>
      <div>
        <h4 style={styles.footerTitle}>CONTACT</h4>
        <div style={styles.footerText}>
          <p>📞 +27 11 123 4567</p>
          <p>📧 info@finetunestudios.com</p>
          <p>📍 10 Muswell Rd S, Bryanston</p>
        </div>
      </div>
      <div>
        <h4 style={styles.footerTitle}>HOURS</h4>
        <p style={styles.footerText}>Monday - Sunday</p>
        <p style={{color: colors.white, fontWeight: '600', fontSize: '18px'}}>9:00 AM - 10:00 PM</p>
      </div>
    </div>
    <div style={styles.footerBottom}>
      © 2024 Finetune Studios. All rights reserved.
    </div>
  </footer>
);

// Home Page
const HomePage = ({ onNavigate }) => {
  const features = [
    { icon: '🎤', title: 'Premium Equipment', desc: 'State-of-the-art recording gear and instruments from industry-leading brands' },
    { icon: '👥', title: 'Expert Engineers', desc: 'Grammy-nominated audio professionals ready to bring your vision to life' },
    { icon: '🕐', title: 'Flexible Hours', desc: 'Available 7 days a week, accommodating your creative schedule' },
    { icon: '📍', title: 'Prime Location', desc: 'Bryanston, Sandton - easily accessible with secure parking' }
  ];

  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          PROFESSIONAL<br />
          <span style={{color: colors.red}}>RECORDING</span> STUDIOS
        </h1>
        <p style={styles.heroSubtitle}>
          World-class facilities for music production, podcasting, and audio post-production in Johannesburg
        </p>
        <button style={{...styles.btnPrimary, fontSize: '18px', padding: '16px 40px'}} onClick={() => onNavigate('book')}>
          Book Your Session →
        </button>
      </section>

      {/* Features */}
      <section style={styles.sectionGray}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <h2 style={styles.sectionTitle}>WHY CHOOSE <span style={{color: colors.red}}>FINETUNE</span></h2>
          <p style={styles.sectionSubtitle}>Renowned as the heart of creative services with world-class technology and talent</p>
          <div style={styles.grid4}>
            {features.map((item, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{item.icon}</div>
                <h3 style={styles.featureTitle}>{item.title}</h3>
                <p style={styles.featureDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studios */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>OUR <span style={{color: colors.red}}>STUDIOS</span></h2>
        <p style={styles.sectionSubtitle}>4 world-class audio studios fully equipped with the latest hardware and software</p>
        <div style={styles.grid2}>
          {studios.map(studio => (
            <div key={studio.id} style={styles.studioCard}>
              <div style={styles.studioImage}>{studio.image}</div>
              <div style={styles.studioContent}>
                <h3 style={styles.studioName}>{studio.name}</h3>
                <p style={styles.studioDesc}>{studio.description}</p>
                <div style={styles.studioFeatures}>
                  {studio.features.map((feature, i) => (
                    <span key={i} style={styles.studioFeatureTag}>{feature}</span>
                  ))}
                </div>
                <div style={styles.studioMeta}>
                  <span>👥 {studio.capacity} people</span>
                  <span>📍 {studio.location}</span>
                </div>
                <div style={styles.studioFooter}>
                  <span style={styles.studioPrice}>R{studio.hourlyRate}<span style={styles.studioPriceUnit}>/hr</span></span>
                  <button style={styles.btnSecondary} onClick={() => onNavigate('book')}>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>READY TO CREATE?</h2>
        <p style={styles.ctaSubtitle}>Book your session today and experience the difference of professional recording</p>
        <button style={{...styles.btnPrimary, fontSize: '18px', padding: '16px 48px'}} onClick={() => onNavigate('book')}>
          Start Booking Now
        </button>
      </section>
    </div>
  );
};

// Login Page
const LoginPage = ({ isAdmin, onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: 'info', text: 'Signing in...' });
    
    const result = await loginUser(email, password, isAdmin ? 'admin' : 'user');
    
    if (result.success) {
      setMessage({ type: 'success', text: '✅ Login successful! Redirecting...' });
      setTimeout(() => onLogin(result.user, isAdmin ? 'admin' : 'user'), 1000);
    } else {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    }
  };

  return (
    <div style={{...styles.page, backgroundColor: colors.gray50}}>
      <header style={styles.innerHeader}>
        <div style={styles.innerHeaderContent}>
          <button style={styles.backButton} onClick={() => onNavigate('home')}>← Back to Home</button>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '24px'}}>🎵</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px'}}>FINETUNE STUDIOS</span>
          </div>
        </div>
      </header>

      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div style={styles.loginIcon}>🔐</div>
            <h1 style={styles.loginTitle}>{isAdmin ? 'ADMIN' : 'USER'} LOGIN</h1>
            <p style={styles.loginSubtitle}>{isAdmin ? 'Access the admin dashboard' : 'Sign in to manage your bookings'}</p>
          </div>

          {isAdmin && (
            <div style={{...styles.alert, ...styles.alertInfo, marginBottom: '24px'}}>
              <strong>Demo Credentials:</strong><br />
              Email: huve@marketing2themax.co.za<br />
              Password: Admin@123
            </div>
          )}

          {message.text && (
            <div style={{
              ...styles.alert,
              ...(message.type === 'success' ? styles.alertSuccess : message.type === 'error' ? styles.alertError : styles.alertInfo)
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="your@email.com"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} style={{...styles.btnPrimary, width: '100%', padding: '16px'}}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          {!isAdmin && (
            <div style={{marginTop: '24px', textAlign: 'center', borderTop: `1px solid ${colors.gray200}`, paddingTop: '24px'}}>
              <p style={{color: colors.gray500, marginBottom: '12px'}}>Don't have an account?</p>
              <button 
                style={{...styles.btnSecondary, width: '100%'}}
                onClick={() => onNavigate('signup')}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Signup Page
const SignupPage = ({ onSignup, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: 'info', text: 'Creating account...' });
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    const result = await signupUser(email, password, name, phone);
    
    if (result.success) {
      setMessage({ type: 'success', text: '✅ Account created successfully! Logging you in...' });
      setTimeout(() => onSignup(result.user, 'user'), 1500);
    } else {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    }
  };

  return (
    <div style={{...styles.page, backgroundColor: colors.gray50}}>
      <header style={styles.innerHeader}>
        <div style={styles.innerHeaderContent}>
          <button style={styles.backButton} onClick={() => onNavigate('home')}>← Back to Home</button>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '24px'}}>🎵</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px'}}>FINETUNE STUDIOS</span>
          </div>
        </div>
      </header>

      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div style={styles.loginIcon}>✨</div>
            <h1 style={styles.loginTitle}>CREATE YOUR ACCOUNT</h1>
            <p style={styles.loginSubtitle}>Join us and start booking your studio sessions</p>
          </div>

          {message.text && (
            <div style={{
              ...styles.alert,
              ...(message.type === 'success' ? styles.alertSuccess : message.type === 'error' ? styles.alertError : styles.alertInfo)
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
                placeholder="John Doe"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="your@email.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={styles.input}
                placeholder="+27 (0)11 234 5678"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
              <p style={{fontSize: '12px', color: colors.gray500, marginTop: '8px'}}>
                Must be at least 6 characters
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} style={{...styles.btnPrimary, width: '100%', padding: '16px'}}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{marginTop: '24px', textAlign: 'center', borderTop: `1px solid ${colors.gray200}`, paddingTop: '24px'}}>
            <p style={{color: colors.gray500, marginBottom: '12px'}}>Already have an account?</p>
            <button 
              style={{...styles.btnSecondary, width: '100%'}}
              onClick={() => onNavigate('login-user')}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ user, onNavigate, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  // Guard: Only admins can view this dashboard
  useEffect(() => {
    if (user && user.role !== 'admin') {
      console.warn('Non-admin user attempted to access AdminDashboard; redirecting to home');
      onNavigate('home');
    }
  }, [user, onNavigate]);

  // Don't render if user is not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const loadBookings = async () => {
    const result = await getAllBookings();
    if (result.success) {
      setBookings(result.data);
    }
    setLoading(false);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: '📅' },
    { label: 'Active Studios', value: 4, icon: '🎵' },
    { label: 'Services', value: 6, icon: '🎤' },
    { label: 'Revenue', value: `R${totalRevenue.toLocaleString()}`, icon: '💰' }
  ];

  return (
    <div style={{...styles.page, backgroundColor: colors.gray100}}>
      <header style={styles.dashboardHeader}>
        <div style={styles.dashboardHeaderContent}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <span style={{fontSize: '24px'}}>🎵</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px'}}>FINETUNE STUDIOS - ADMIN</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
            <span style={{fontSize: '14px'}}>Welcome, <strong style={{color: colors.red}}>{user?.name}</strong></span>
            <button style={styles.navLink} onClick={() => onNavigate('home')}>Public Site</button>
            <button style={styles.btnPrimary} onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 24px'}}>
        <h1 style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', letterSpacing: '2px'}}>ADMIN DASHBOARD</h1>

        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <div style={styles.statIcon}>{stat.icon}</div>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statValue}>{loading ? '...' : stat.value}</div>
            </div>
          ))}
        </div>

        <div style={styles.tableContainer}>
          <div style={styles.tableTitle}>ALL BOOKINGS ({bookings.length})</div>
          {loading ? (
            <div style={{padding: '48px', textAlign: 'center', color: colors.gray500}}>Loading bookings...</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.th}>Booking #</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Studio</th>
                    <th style={styles.th}>Service</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id || i}>
                      <td style={styles.td}><strong style={{fontFamily: 'monospace'}}>{b.booking_number}</strong></td>
                      <td style={styles.td}>
                        <div style={{fontWeight: '600'}}>{b.client_name}</div>
                        <div style={{fontSize: '12px', color: colors.gray500}}>{b.client_email}</div>
                      </td>
                      <td style={styles.td}>{studios.find(s => s.id === b.studio_id)?.name || b.studio_id}</td>
                      <td style={styles.td}>{services.find(s => s.id === b.service_id)?.name || b.service_id}</td>
                      <td style={styles.td}>{b.date}</td>
                      <td style={{...styles.td, fontWeight: '600'}}>{b.time}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(b.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending)
                        }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Booking Flow
const BookingFlow = ({ user, onNavigate }) => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    studioId: '',
    serviceId: '',
    date: '',
    time: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientNotes: ''
  });
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyBookings, setMonthlyBookings] = useState({});

  const updateBooking = (key, value) => {
    setBookingData(prev => ({ ...prev, [key]: value }));
  };

  // Load monthly bookings for calendar view
  const loadMonthlyBookings = async (month, studioId) => {
    if (!studioId) return;
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const firstDay = new Date(year, monthNum, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, monthNum + 1, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bookings')
      .select('date')
      .eq('studio_id', studioId)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .in('status', ['confirmed', 'pending']);
    
    if (!error && data) {
      const bookingCounts = {};
      data.forEach(b => {
        bookingCounts[b.date] = (bookingCounts[b.date] || 0) + 1;
      });
      setMonthlyBookings(bookingCounts);
    }
  };

  const loadTimeSlots = async (date, studioId) => {
    if (!date || !studioId) return;
    setLoadingSlots(true);
    const result = await getBookingsByDateAndStudio(date, studioId);
    if (result.success) {
      setConfirmedBookings(result.data);
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    if (bookingData.studioId && step === 3) {
      loadMonthlyBookings(currentMonth, bookingData.studioId);
    }
  }, [bookingData.studioId, currentMonth, step]);

  useEffect(() => {
    if (bookingData.date && bookingData.studioId) {
      loadTimeSlots(bookingData.date, bookingData.studioId);
    }
  }, [bookingData.date, bookingData.studioId]);

  const nextStep = () => {
    if (step === 1 && !bookingData.studioId) return alert('Please select a studio');
    if (step === 2 && !bookingData.serviceId) return alert('Please select a service');
    if (step === 3 && (!bookingData.date || !bookingData.time)) return alert('Please select date and time');
    if (step === 4 && (!bookingData.clientName || !bookingData.clientEmail)) return alert('Please fill in your name and email');
    setStep(prev => prev + 1);
  };

  const submitBooking = async () => {
    const service = services.find(s => s.id === bookingData.serviceId);
    const result = await createBooking({
      user_id: user?.id,
      studio_id: bookingData.studioId,
      service_id: bookingData.serviceId,
      date: bookingData.date,
      time: bookingData.time,
      client_name: bookingData.clientName,
      client_email: bookingData.clientEmail,
      client_phone: bookingData.clientPhone,
      client_notes: bookingData.clientNotes,
      status: 'confirmed',
      total_price: service?.price
    });

    if (result.success) {
      alert('🎉 Booking confirmed! You will receive a confirmation email shortly.');
      onNavigate('home');
    } else {
      alert('Booking failed: ' + result.error);
    }
  };

  const bookedSlots = confirmedBookings.filter(b => b.date === bookingData.date).map(b => b.time);
  const selectedStudio = studios.find(s => s.id === bookingData.studioId);
  const selectedService = services.find(s => s.id === bookingData.serviceId);

  const stepLabels = ['Studio', 'Service', 'Time', 'Details', 'Confirm'];

  return (
    <div style={{...styles.page, backgroundColor: colors.gray100}}>
      <header style={styles.innerHeader}>
        <div style={styles.innerHeaderContent}>
          <button style={styles.backButton} onClick={() => onNavigate('home')}>← Back to Home</button>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '24px'}}>🎵</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px'}}>FINETUNE STUDIOS</span>
          </div>
        </div>
      </header>

      <div style={styles.bookingContainer}>
        <h1 style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', letterSpacing: '2px', textAlign: 'center'}}>BOOK YOUR SESSION</h1>

        {/* Progress */}
        <div style={styles.progressContainer}>
          <div style={styles.progressLine}></div>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} style={styles.progressStep}>
              <div style={{
                ...styles.progressCircle,
                ...(step >= s ? styles.progressCircleActive : styles.progressCircleInactive)
              }}>
                {s}
              </div>
              <span style={{...styles.progressLabel, color: step >= s ? colors.red : colors.gray400}}>
                {stepLabels[s - 1]}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.bookingCard}>
          {/* Step 1: Select Studio */}
          {step === 1 && (
            <>
              <h2 style={styles.bookingTitle}>SELECT STUDIO</h2>
              <div style={styles.selectionGrid}>
                {studios.map(studio => (
                  <button
                    key={studio.id}
                    onClick={() => updateBooking('studioId', studio.id)}
                    style={{
                      ...styles.selectionCard,
                      ...(bookingData.studioId === studio.id ? styles.selectionCardActive : {})
                    }}
                  >
                    <div style={styles.selectionIcon}>{studio.image}</div>
                    <div style={styles.selectionName}>{studio.name}</div>
                    <div style={styles.selectionMeta}>{studio.location}</div>
                    <div style={styles.selectionPrice}>R{studio.hourlyRate}/hr</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Select Service */}
          {step === 2 && (
            <>
              <h2 style={styles.bookingTitle}>SELECT SERVICE</h2>
              <div style={styles.serviceList}>
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => updateBooking('serviceId', service.id)}
                    style={{
                      ...styles.serviceCard,
                      ...(bookingData.serviceId === service.id ? styles.selectionCardActive : {})
                    }}
                  >
                    <div>
                      <div style={{fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px'}}>{service.name}</div>
                      <div style={{fontSize: '14px', color: colors.gray500}}>{service.duration} minutes</div>
                    </div>
                    <div style={{fontSize: '24px', fontWeight: 'bold', color: colors.red}}>R{service.price}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <>
              <h2 style={styles.bookingTitle}>SELECT DATE & TIME</h2>
              
              {/* Calendar View */}
              <div style={{marginBottom: '32px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    style={{...styles.btnSecondary, padding: '8px 16px'}}
                  >
                    ← Prev
                  </button>
                  <h3 style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px'}}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    style={{...styles.btnSecondary, padding: '8px 16px'}}
                  >
                    Next →
                  </button>
                </div>

                {/* Legend */}
                <div style={{display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <div style={{width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '4px'}}></div>
                    <span>Available</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <div style={{width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '4px'}}></div>
                    <span>Limited</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <div style={{width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '4px'}}></div>
                    <span>Full</span>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: colors.gray600
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px'
                }}>
                  {(() => {
                    const year = currentMonth.getFullYear();
                    const month = currentMonth.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const today = new Date().toISOString().split('T')[0];
                    const days = [];

                    // Empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} style={{padding: '12px'}}></div>);
                    }

                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const dateStr = date.toISOString().split('T')[0];
                      const isPast = dateStr < today;
                      const isSelected = bookingData.date === dateStr;
                      const bookingCount = monthlyBookings[dateStr] || 0;
                      
                      // Color coding based on bookings (assuming 10 total slots per day)
                      let bgColor = colors.white;
                      let borderColor = colors.gray300;
                      if (!isPast) {
                        if (bookingCount >= 10) {
                          bgColor = '#fee2e2'; // red - full
                          borderColor = '#ef4444';
                        } else if (bookingCount >= 7) {
                          bgColor = '#fef3c7'; // yellow - limited
                          borderColor = '#f59e0b';
                        } else {
                          bgColor = '#d1fae5'; // green - available
                          borderColor = '#10b981';
                        }
                      }

                      days.push(
                        <button
                          key={day}
                          onClick={() => {
                            if (!isPast) {
                              updateBooking('date', dateStr);
                              updateBooking('time', '');
                            }
                          }}
                          disabled={isPast}
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            border: `2px solid ${isSelected ? colors.red : borderColor}`,
                            borderRadius: '8px',
                            backgroundColor: isSelected ? colors.red : bgColor,
                            color: isPast ? colors.gray400 : isSelected ? colors.white : colors.black,
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            opacity: isPast ? 0.4 : 1
                          }}
                        >
                          <div>{day}</div>
                          {!isPast && bookingCount > 0 && (
                            <div style={{fontSize: '10px', marginTop: '2px'}}>
                              {bookingCount >= 10 ? 'Full' : `${bookingCount}/${10}`}
                            </div>
                          )}
                        </button>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>

              {bookingData.date && (
                <div style={{marginTop: '24px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                    <label style={styles.label}>Available Time Slots</label>
                    <span style={{fontSize: '14px', color: colors.gray500}}>
                      {availableSlots.length - bookedSlots.length} of {availableSlots.length} available
                    </span>
                  </div>
                  {loadingSlots ? (
                    <div style={{textAlign: 'center', padding: '32px', color: colors.gray500}}>Loading...</div>
                  ) : (
                    <div style={styles.timeGrid}>
                      {availableSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            onClick={() => !isBooked && updateBooking('time', slot)}
                            disabled={isBooked}
                            style={{
                              ...styles.timeSlot,
                              ...(isBooked ? styles.timeSlotBooked : {}),
                              ...(bookingData.time === slot ? styles.timeSlotActive : {})
                            }}
                          >
                            {slot}
                            {isBooked && <div style={{fontSize: '10px', marginTop: '4px'}}>Booked</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 4: Your Details */}
          {step === 4 && (
            <>
              <h2 style={styles.bookingTitle}>YOUR DETAILS</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  value={bookingData.clientName}
                  onChange={(e) => updateBooking('clientName', e.target.value)}
                  style={styles.input}
                  placeholder="John Doe"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address *</label>
                <input
                  type="email"
                  value={bookingData.clientEmail}
                  onChange={(e) => updateBooking('clientEmail', e.target.value)}
                  style={styles.input}
                  placeholder="john@example.com"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={bookingData.clientPhone}
                  onChange={(e) => updateBooking('clientPhone', e.target.value)}
                  style={styles.input}
                  placeholder="+27 11 123 4567"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Notes</label>
                <textarea
                  value={bookingData.clientNotes}
                  onChange={(e) => updateBooking('clientNotes', e.target.value)}
                  style={styles.textarea}
                  placeholder="Any special requirements or requests..."
                />
              </div>
            </>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <>
              <h2 style={styles.bookingTitle}>REVIEW & CONFIRM</h2>
              <div style={styles.summaryBox}>
                <div style={styles.summaryTitle}>BOOKING SUMMARY</div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Studio:</span>
                  <span style={styles.summaryValue}>{selectedStudio?.name}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Service:</span>
                  <span style={styles.summaryValue}>{selectedService?.name}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Date & Time:</span>
                  <span style={styles.summaryValue}>{bookingData.date} at {bookingData.time}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Duration:</span>
                  <span style={styles.summaryValue}>{selectedService?.duration} minutes</span>
                </div>
                <div style={{...styles.summaryRow, borderTop: `1px solid ${colors.gray300}`, paddingTop: '16px', marginTop: '8px'}}>
                  <span style={styles.summaryLabel}>Total Price:</span>
                  <span style={styles.summaryTotal}>R{selectedService?.price}</span>
                </div>
              </div>
              <div style={styles.summaryBox}>
                <div style={styles.summaryTitle}>YOUR DETAILS</div>
                <p><span style={styles.summaryLabel}>Name:</span> {bookingData.clientName}</p>
                <p><span style={styles.summaryLabel}>Email:</span> {bookingData.clientEmail}</p>
                <p><span style={styles.summaryLabel}>Phone:</span> {bookingData.clientPhone || 'Not provided'}</p>
                {bookingData.clientNotes && <p><span style={styles.summaryLabel}>Notes:</span> {bookingData.clientNotes}</p>}
              </div>
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={styles.navButtons}>
          {step > 1 ? (
            <button style={styles.btnOutline} onClick={() => setStep(prev => prev - 1)}>Previous</button>
          ) : <div></div>}
          {step < 5 ? (
            <button style={styles.btnPrimary} onClick={nextStep}>Next Step →</button>
          ) : (
            <button style={styles.btnSecondary} onClick={submitBooking}>✓ Confirm Booking</button>
          )}
        </div>
      </div>
    </div>
  );
};

// Studios Page
const StudiosPage = ({ onNavigate }) => (
  <div style={styles.page}>
    <section style={styles.hero}>
      <h1 style={{...styles.heroTitle, fontSize: '48px'}}>OUR STUDIOS</h1>
      <p style={styles.heroSubtitle}>Four world-class recording environments designed for every creative need</p>
    </section>
    <section style={styles.section}>
      <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
        {studios.map(studio => (
          <div key={studio.id} style={{...styles.studioCard, display: 'flex', flexDirection: 'row'}}>
            <div style={{...styles.studioImage, width: '300px', minHeight: '250px'}}>{studio.image}</div>
            <div style={{...styles.studioContent, flex: 1}}>
              <h2 style={{...styles.studioName, fontSize: '28px'}}>{studio.name}</h2>
              <p style={{...styles.studioDesc, fontSize: '16px'}}>{studio.description}</p>
              <div style={styles.studioFeatures}>
                {studio.features.map((feature, i) => (
                  <span key={i} style={styles.studioFeatureTag}>{feature}</span>
                ))}
              </div>
              <div style={styles.studioMeta}>
                <span>👥 Up to {studio.capacity} people</span>
                <span>📍 {studio.location}</span>
              </div>
              <div style={styles.studioFooter}>
                <span style={{...styles.studioPrice, fontSize: '36px'}}>R{studio.hourlyRate}<span style={styles.studioPriceUnit}>/hour</span></span>
                <button style={styles.btnPrimary} onClick={() => onNavigate('book')}>Book This Studio</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function FinetuneStudios() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user, role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentUser(user);
    setCurrentPage(role === 'admin' ? 'admin-dashboard' : 'home');
  };

  const handleSignup = (user, role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentUser(user);
    setCurrentPage(role === 'user' ? 'home' : 'admin-dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const showNav = !['login-admin', 'login-user', 'signup', 'admin-dashboard', 'book'].includes(currentPage);

  return (
    <div>
      {showNav && (
        <Navigation
          currentPage={currentPage}
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
      {currentPage === 'studios' && <StudiosPage onNavigate={setCurrentPage} />}
      {currentPage === 'login-admin' && <LoginPage isAdmin={true} onLogin={handleLogin} onNavigate={setCurrentPage} />}
      {currentPage === 'login-user' && <LoginPage isAdmin={false} onLogin={handleLogin} onNavigate={setCurrentPage} />}
      {currentPage === 'signup' && <SignupPage onSignup={handleSignup} onNavigate={setCurrentPage} />}
      {currentPage === 'admin-dashboard' && <AdminDashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />}
      {currentPage === 'book' && <BookingFlow user={currentUser} onNavigate={setCurrentPage} />}

      {showNav && <Footer />}
    </div>
  );
}
