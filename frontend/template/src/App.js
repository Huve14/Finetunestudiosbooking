import React, { useState, useEffect } from 'react';

// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://yqiktstghcnxglrcjyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWt0c3RnaGNueGdscmNqeWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDkxMDksImV4cCI6MjA4NTA4NTEwOX0.HST-SwwXDOtJ5uaPQ-1QK4fVTw8f5CzWEys2Diqp3ks';

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
async function loginUser(email, password, role) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&role=eq.${role}&is_active=eq.true`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const users = await response.json();
    if (users.length === 0) return { success: false, error: 'User not found' };
    const user = users[0];
    if (user.password !== password) return { success: false, error: 'Invalid password' };
    return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllBookings() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const bookings = await response.json();
    return { success: true, data: bookings };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getBookingsByDateAndStudio(date, studioId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?date=eq.${date}&studio_id=eq.${studioId}&status=in.(confirmed,pending)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const bookings = await response.json();
    return { success: true, data: bookings };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createBooking(bookingData) {
  try {
    const allBookings = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const bookings = await allBookings.json();
    const bookingNumber = `FTS-${new Date().getFullYear()}-${String(bookings.length + 1).padStart(4, '0')}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ booking_number: bookingNumber, ...bookingData })
    });
    const booking = await response.json();
    return { success: true, data: booking[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// CUSTOM STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap');
  
  :root {
    --red-primary: #dc2626;
    --red-hover: #b91c1c;
    --black: #0a0a0a;
    --white: #ffffff;
    --gray-50: #fafafa;
    --gray-100: #f4f4f5;
    --gray-200: #e4e4e7;
    --gray-300: #d4d4d8;
    --gray-400: #a1a1aa;
    --gray-500: #71717a;
    --gray-600: #52525b;
    --gray-700: #3f3f46;
    --gray-800: #27272a;
    --gray-900: #18181b;
  }
  
  * {
    font-family: 'Barlow', sans-serif;
  }
  
  .font-display {
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 0.05em;
  }
  
  .gradient-hero {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a0a0a 100%);
  }
  
  .gradient-card {
    background: linear-gradient(145deg, #1a1a1a 0%, #2d0a0a 100%);
  }
  
  .noise-overlay {
    position: relative;
  }
  
  .noise-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
  }
  
  .glow-red {
    box-shadow: 0 0 30px rgba(220, 38, 38, 0.3);
  }
  
  .border-glow {
    position: relative;
  }
  
  .border-glow::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, #dc2626, transparent, #dc2626);
    z-index: -1;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .border-glow:hover::after {
    opacity: 1;
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .animate-slide-up {
    animation: slideUp 0.6s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
  }
  
  @keyframes slideUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  
  .btn-primary {
    background: var(--red-primary);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
  }
  
  .btn-primary:hover {
    background: var(--red-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
  }
  
  .btn-secondary {
    background: var(--black);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }
  
  .btn-secondary:hover {
    background: var(--red-primary);
  }
  
  .input-field {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid var(--gray-300);
    border-radius: 0.5rem;
    transition: all 0.2s;
    background: white;
  }
  
  .input-field:focus {
    outline: none;
    border-color: var(--red-primary);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  .card-hover {
    transition: all 0.3s ease;
  }
  
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  .equalizer-bar {
    animation: equalizer 1s ease-in-out infinite;
  }
  
  @keyframes equalizer {
    0%, 100% { height: 8px; }
    50% { height: 24px; }
  }
  
  .eq-1 { animation-delay: 0s; }
  .eq-2 { animation-delay: 0.2s; }
  .eq-3 { animation-delay: 0.4s; }
  .eq-4 { animation-delay: 0.1s; }
  .eq-5 { animation-delay: 0.3s; }
`;

// ============================================================
// COMPONENTS
// ============================================================

// Animated Equalizer
const Equalizer = () => (
  <div className="flex items-end gap-1 h-8">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`w-1 bg-red-600 rounded-full equalizer-bar eq-${i}`}
        style={{ minHeight: '8px' }}
      />
    ))}
  </div>
);

// Navigation
const Navigation = ({ currentPage, isAuthenticated, userRole, onNavigate, onLogout }) => (
  <header className="bg-black text-white sticky top-0 z-50 noise-overlay">
    <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-3 group">
        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          🎵
        </div>
        <span className="text-2xl font-display tracking-wider">FINETUNE STUDIOS</span>
      </button>
      <div className="flex gap-6 items-center">
        <button onClick={() => onNavigate('home')} className="hover:text-red-500 uppercase text-sm font-semibold tracking-wide transition-colors">Home</button>
        <button onClick={() => onNavigate('studios')} className="hover:text-red-500 uppercase text-sm font-semibold tracking-wide transition-colors">Studios</button>
        {isAuthenticated ? (
          <>
            <button onClick={() => onNavigate(userRole === 'admin' ? 'admin-dashboard' : 'user-dashboard')} className="hover:text-red-500 uppercase text-sm font-semibold tracking-wide transition-colors">Dashboard</button>
            <button onClick={onLogout} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 uppercase text-sm transition-colors">Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => onNavigate('login-user')} className="hover:text-red-500 uppercase text-sm font-semibold tracking-wide transition-colors">Login</button>
            <button onClick={() => onNavigate('login-admin')} className="text-red-500 hover:text-red-400 uppercase text-sm font-semibold tracking-wide transition-colors">Admin</button>
          </>
        )}
        <button onClick={() => onNavigate('book')} className="btn-primary flex items-center gap-2">
          <span>Book Now</span>
          <Equalizer />
        </button>
      </div>
    </nav>
  </header>
);

// Footer
const Footer = () => (
  <footer className="bg-black text-white py-16 noise-overlay">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center text-3xl">
              🎵
            </div>
            <span className="text-3xl font-display tracking-wider">FINETUNE STUDIOS</span>
          </div>
          <p className="text-gray-400 max-w-md leading-relaxed">
            Professional recording facilities in the heart of Bryanston, Sandton. 
            World-class equipment meets creative excellence.
          </p>
        </div>
        <div>
          <h4 className="font-display text-xl text-red-500 mb-4 tracking-wide">CONTACT</h4>
          <div className="space-y-3 text-gray-400">
            <p className="flex items-center gap-2"><span className="text-red-500">📞</span> +27 11 123 4567</p>
            <p className="flex items-center gap-2"><span className="text-red-500">📧</span> info@finetunestudios.com</p>
            <p className="flex items-center gap-2"><span className="text-red-500">📍</span> 10 Muswell Rd S, Bryanston</p>
          </div>
        </div>
        <div>
          <h4 className="font-display text-xl text-red-500 mb-4 tracking-wide">HOURS</h4>
          <p className="text-gray-400">Monday - Sunday</p>
          <p className="text-white font-semibold text-lg">9:00 AM - 10:00 PM</p>
          <div className="mt-4 flex gap-3">
            {['📸', '🎵', '📺'].map((icon, i) => (
              <button key={i} className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors">
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
        <p>© 2024 Finetune Studios. All rights reserved.</p>
      </div>
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-32 noise-overlay relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px bg-gradient-to-b from-transparent via-red-500 to-transparent"
              style={{
                left: `${i * 5}%`,
                height: '100%',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="animate-slide-up">
            <h1 className="text-7xl font-display tracking-wider mb-6">
              PROFESSIONAL<br />
              <span className="text-red-500">RECORDING</span> STUDIOS
            </h1>
          </div>
          <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto animate-slide-up stagger-1">
            World-class facilities for music production, podcasting, and audio post-production in Johannesburg
          </p>
          <button 
            onClick={() => onNavigate('book')} 
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-4 animate-slide-up stagger-2"
          >
            Book Your Session
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display tracking-wide mb-4">WHY CHOOSE <span className="text-red-600">FINETUNE</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Renowned as the heart of creative services with world-class technology and talent
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((item, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-2xl shadow-lg border-t-4 border-red-600 card-hover animate-slide-up stagger-${index + 1}`}
              >
                <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center text-4xl mb-6">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl tracking-wide mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studios Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display tracking-wide mb-4">OUR <span className="text-red-600">STUDIOS</span></h2>
            <p className="text-gray-600">4 world-class audio studios fully equipped with the latest hardware and software</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {studios.map((studio, index) => (
              <div 
                key={studio.id} 
                className={`bg-gray-50 rounded-2xl shadow-lg overflow-hidden card-hover border-l-4 border-red-600 animate-slide-up stagger-${(index % 4) + 1}`}
              >
                <div className="h-48 gradient-card flex items-center justify-center text-8xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="relative z-10 animate-float">{studio.image}</span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl tracking-wide mb-2">{studio.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">{studio.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {studio.features.map((feature, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-200 rounded-full text-xs font-semibold text-gray-700">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">👥 {studio.capacity} people</span>
                    <span className="flex items-center gap-1">📍 {studio.location}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-3xl font-display text-red-600">R{studio.hourlyRate}<span className="text-sm text-gray-500">/hr</span></span>
                    <button onClick={() => onNavigate('book')} className="btn-secondary text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white noise-overlay">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-display tracking-wide mb-6">READY TO CREATE?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Book your session today and experience the difference of professional recording
          </p>
          <button onClick={() => onNavigate('book')} className="btn-primary text-lg px-12 py-4">
            Start Booking Now
          </button>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 hover:text-red-500 font-semibold uppercase text-sm">
            ← Back to Home
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <span className="text-xl font-display tracking-wide">FINETUNE STUDIOS</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-600 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl glow-red">
              🔐
            </div>
            <h1 className="text-3xl font-display tracking-wide">{isAdmin ? 'ADMIN' : 'USER'} LOGIN</h1>
            <p className="text-gray-600 mt-2">
              {isAdmin ? 'Access the admin dashboard' : 'Sign in to manage your bookings'}
            </p>
          </div>

          {isAdmin && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <strong>Demo Credentials:</strong><br />
                Email: huve@marketing2themax.co.za<br />
                Password: Admin@123
              </p>
            </div>
          )}

          {message.text && (
            <div className={`p-4 mb-6 rounded-lg border-l-4 ${
              message.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
              'bg-blue-50 border-blue-500 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
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

  const loadBookings = async () => {
    const result = await getAllBookings();
    if (result.success) {
      setBookings(result.data);
    }
    setLoading(false);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white py-4 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <span className="text-xl font-display tracking-wide">FINETUNE STUDIOS - ADMIN PORTAL</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm">Welcome, <strong className="text-red-500">{user?.name}</strong></span>
            <button onClick={() => onNavigate('home')} className="hover:text-red-500 uppercase text-sm font-semibold">Public Site</button>
            <button onClick={onLogout} className="btn-primary py-2 px-4 text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-display tracking-wide mb-8">ADMIN DASHBOARD</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: '📅' },
            { label: 'Active Studios', value: 4, icon: '🎵' },
            { label: 'Services', value: 6, icon: '🎤' },
            { label: 'Revenue', value: `R${totalRevenue.toLocaleString()}`, icon: '💰' }
          ].map((stat, index) => (
            <div key={index} className={`bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600 animate-slide-up stagger-${index + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-4xl font-display text-black">{loading ? '...' : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-up">
          <h2 className="text-2xl font-display tracking-wide mb-6">ALL BOOKINGS ({bookings.length})</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading bookings...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    {['Booking #', 'Client', 'Studio', 'Service', 'Date', 'Time', 'Status'].map(header => (
                      <th key={header} className="p-4 text-left text-xs font-semibold uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((b, i) => (
                    <tr key={b.id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-sm font-semibold">{b.booking_number}</td>
                      <td className="p-4">
                        <div className="font-semibold">{b.client_name}</div>
                        <div className="text-xs text-gray-500">{b.client_email}</div>
                      </td>
                      <td className="p-4">{studios.find(s => s.id === b.studio_id)?.name || b.studio_id}</td>
                      <td className="p-4">{services.find(s => s.id === b.service_id)?.name || b.service_id}</td>
                      <td className="p-4">{b.date}</td>
                      <td className="p-4 font-semibold">{b.time}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
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

  const updateBooking = (key, value) => {
    setBookingData(prev => ({ ...prev, [key]: value }));
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white py-4 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 hover:text-red-500 font-semibold uppercase text-sm">
            ← Back to Home
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <span className="text-xl font-display tracking-wide">FINETUNE STUDIOS</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-display tracking-wide mb-8 text-center">BOOK YOUR SESSION</h1>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 -z-10" />
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 transition-all ${
                step >= s ? 'bg-red-600 text-white scale-110' : 'bg-gray-300 text-gray-600'
              }`}>
                {s}
              </div>
              <span className={`text-xs mt-2 font-semibold uppercase ${step >= s ? 'text-red-600' : 'text-gray-400'}`}>
                {['Studio', 'Service', 'Time', 'Details', 'Confirm'][s - 1]}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-t-4 border-red-600 animate-slide-up">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-display tracking-wide mb-6">SELECT STUDIO</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {studios.map(studio => (
                  <button
                    key={studio.id}
                    onClick={() => updateBooking('studioId', studio.id)}
                    className={`p-5 border-2 rounded-xl text-left transition-all card-hover ${
                      bookingData.studioId === studio.id ? 'border-red-600 bg-red-50 shadow-lg' : 'border-gray-200 hover:border-red-400'
                    }`}
                  >
                    <div className="text-5xl mb-3">{studio.image}</div>
                    <h3 className="font-display text-lg tracking-wide">{studio.name}</h3>
                    <p className="text-xs text-gray-500">{studio.location}</p>
                    <p className="text-red-600 font-display text-xl mt-2">R{studio.hourlyRate}/hr</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-display tracking-wide mb-6">SELECT SERVICE</h2>
              <div className="space-y-3">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => updateBooking('serviceId', service.id)}
                    className={`w-full p-5 border-2 rounded-xl text-left transition-all ${
                      bookingData.serviceId === service.id ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-display text-xl tracking-wide">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.duration} minutes</p>
                      </div>
                      <span className="text-red-600 font-display text-2xl">R{service.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-display tracking-wide mb-6">SELECT DATE & TIME</h2>
              <div className="space-y-6">
                <div>
                  <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Date</label>
                  <input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => {
                      updateBooking('date', e.target.value);
                      updateBooking('time', '');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>
                {bookingData.date && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="font-semibold uppercase text-sm tracking-wide">Available Time Slots</label>
                      <span className="text-sm text-gray-500">{availableSlots.length - bookedSlots.length} of {availableSlots.length} available</span>
                    </div>
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : availableSlots.length - bookedSlots.length === 0 ? (
                      <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
                        <p className="text-red-800 font-bold">No available slots for this date</p>
                        <p className="text-sm text-red-700 mt-1">Please select a different date or studio</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-3">
                        {availableSlots.map(slot => {
                          const isBooked = bookedSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              onClick={() => !isBooked && updateBooking('time', slot)}
                              disabled={isBooked}
                              className={`p-3 border-2 rounded-lg font-bold transition-all relative ${
                                isBooked ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' :
                                bookingData.time === slot ? 'border-red-600 bg-red-50 text-red-600' :
                                'border-gray-200 hover:border-red-400'
                              }`}
                            >
                              {slot}
                              {isBooked && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs bg-black text-white px-2 py-1 rounded font-bold">Booked</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-2xl font-display tracking-wide mb-6">YOUR DETAILS</h2>
              <div className="space-y-5">
                <div>
                  <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Full Name *</label>
                  <input
                    type="text"
                    value={bookingData.clientName}
                    onChange={(e) => updateBooking('clientName', e.target.value)}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Email Address *</label>
                  <input
                    type="email"
                    value={bookingData.clientEmail}
                    onChange={(e) => updateBooking('clientEmail', e.target.value)}
                    className="input-field"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Phone Number</label>
                  <input
                    type="tel"
                    value={bookingData.clientPhone}
                    onChange={(e) => updateBooking('clientPhone', e.target.value)}
                    className="input-field"
                    placeholder="+27 11 123 4567"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 uppercase text-sm tracking-wide">Additional Notes</label>
                  <textarea
                    value={bookingData.clientNotes}
                    onChange={(e) => updateBooking('clientNotes', e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Any special requirements or requests..."
                  />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-2xl font-display tracking-wide mb-6">REVIEW & CONFIRM</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-red-600">
                  <h3 className="font-display text-xl text-red-600 mb-4 tracking-wide">BOOKING SUMMARY</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-600 font-semibold">Studio:</span><span className="font-bold">{selectedStudio?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 font-semibold">Service:</span><span className="font-bold">{selectedService?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 font-semibold">Date & Time:</span><span className="font-bold">{bookingData.date} at {bookingData.time}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 font-semibold">Duration:</span><span className="font-bold">{selectedService?.duration} minutes</span></div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-gray-600 font-semibold">Total Price:</span>
                      <span className="text-3xl font-display text-red-600">R{selectedService?.price}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-red-600">
                  <h3 className="font-display text-xl text-red-600 mb-4 tracking-wide">YOUR DETAILS</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-600 font-semibold">Name:</span> {bookingData.clientName}</p>
                    <p><span className="text-gray-600 font-semibold">Email:</span> {bookingData.clientEmail}</p>
                    <p><span className="text-gray-600 font-semibold">Phone:</span> {bookingData.clientPhone || 'Not provided'}</p>
                    {bookingData.clientNotes && <p><span className="text-gray-600 font-semibold">Notes:</span> {bookingData.clientNotes}</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(prev => prev - 1)} className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50 uppercase text-sm">
              Previous
            </button>
          ) : <div />}
          {step < 5 ? (
            <button onClick={nextStep} className="btn-primary">
              Next Step →
            </button>
          ) : (
            <button onClick={submitBooking} className="btn-secondary px-8 py-3">
              ✓ Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Studios List Page
const StudiosPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50">
    <section className="gradient-hero text-white py-20 noise-overlay">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-display tracking-wider mb-4">OUR STUDIOS</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Four world-class recording environments designed for every creative need
        </p>
      </div>
    </section>
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-8">
          {studios.map((studio, index) => (
            <div 
              key={studio.id} 
              className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row card-hover animate-slide-up stagger-${(index % 4) + 1}`}
            >
              <div className="md:w-1/3 h-64 md:h-auto gradient-card flex items-center justify-center text-8xl relative">
                <span className="animate-float">{studio.image}</span>
              </div>
              <div className="md:w-2/3 p-8">
                <h2 className="font-display text-3xl tracking-wide mb-3">{studio.name}</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">{studio.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {studio.features.map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6 text-gray-500 mb-6">
                  <span className="flex items-center gap-2">👥 Up to {studio.capacity} people</span>
                  <span className="flex items-center gap-2">📍 {studio.location}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-4xl font-display text-red-600">R{studio.hourlyRate}<span className="text-lg text-gray-500">/hour</span></span>
                  <button onClick={() => onNavigate('book')} className="btn-primary">
                    Book This Studio
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
    setCurrentPage(role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen">
        {currentPage !== 'login-admin' && currentPage !== 'login-user' && currentPage !== 'admin-dashboard' && currentPage !== 'book' && (
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
        {currentPage === 'admin-dashboard' && <AdminDashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />}
        {currentPage === 'book' && <BookingFlow user={currentUser} onNavigate={setCurrentPage} />}

        {currentPage !== 'login-admin' && currentPage !== 'login-user' && currentPage !== 'admin-dashboard' && currentPage !== 'book' && (
          <Footer />
        )}
      </div>
    </>
  );
}
