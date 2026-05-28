import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Prevent JS crash if credentials are empty or 'mock' by using safe placeholders
const actualUrl = (supabaseUrl && !supabaseUrl.includes('mock')) ? supabaseUrl : 'https://placeholder-project.supabase.co';
const actualKey = (supabaseAnonKey && !supabaseAnonKey.includes('mock')) ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(actualUrl, actualKey);

export const isMock = false; // Officially launched - mock mode disabled completely

// --- WRAPPER API FUNCTIONS ---

// 1. Subscribe to Auth changes
export function subscribeToAuthChanges(callback) {
  if (isMock) {
    const getSession = () => {
      try {
        const session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
        callback(session || null);
      } catch (e) {
        callback(null);
      }
    };
    getSession();

    const handleStorageChange = () => {
      getSession();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mock-session-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mock-session-change', handleStorageChange);
    };
  }

  // Check initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      callback(session.user);
    } else {
      callback(null);
    }
  });

  // Listen to changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      callback(session.user);
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

// 2. Register user
export async function registerUser(email, password, name, phone) {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    if (users[email.toLowerCase()]) {
      throw new Error("USER ALREADY EXISTS!");
    }

    const mockUser = {
      uid: 'mock-uid-' + Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      verified: false, // New mock users start as unverified
      user_metadata: {
        full_name: name.toUpperCase(),
        phone: phone,
        profile: {
          name: name.toUpperCase(),
          email: email.toLowerCase(),
          phone: phone
        },
        bookings: []
      }
    };

    users[email.toLowerCase()] = { ...mockUser, password };
    localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
    // DO NOT set the session here to prevent automatic login without verification

    return mockUser;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.toUpperCase(),
        phone: phone,
        profile: {
          name: name.toUpperCase(),
          email: email.toUpperCase(),
          phone: phone
        },
        bookings: []
      }
    }
  });

  if (error) throw error;
  
  try {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name: name.toUpperCase(),
      email: email.toUpperCase(),
      phone: phone,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Could not insert to public.profiles table (it may not exist). Using user_metadata as fallback.", err);
  }

  return data.user;
}

// 3. Login user
export async function loginUser(email, password) {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Check secure admin login credentials
    if (email.toLowerCase() === 'admin@darzzee.com' && password === 'darzzeeadmin@delhi2026') {
      const adminUser = {
        uid: 'mock-admin-uid',
        email: 'admin@darzzee.com',
        user_metadata: {
          full_name: 'DARZZEE ADMINISTRATOR',
          phone: '0000000000',
          profile: {
            name: 'DARZZEE ADMINISTRATOR',
            email: 'admin@darzzee.com',
            phone: '0000000000'
          },
          bookings: []
        }
      };
      localStorage.setItem('darzzee_mock_session', JSON.stringify(adminUser));
      window.dispatchEvent(new Event('mock-session-change'));
      return adminUser;
    }

    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    const user = users[email.toLowerCase()];

    if (!user || user.password !== password) {
      throw new Error("INVALID EMAIL OR PASSWORD!");
    }

    if (user.verified === false) {
      throw new Error("PLEASE VERIFY YOUR EMAIL FIRST!");
    }

    const { password: _, ...userSession } = user;
    localStorage.setItem('darzzee_mock_session', JSON.stringify(userSession));
    window.dispatchEvent(new Event('mock-session-change'));
    return userSession;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data.user;
}

// Helper to verify mock user and log them in
export function verifyMockUser(email) {
  if (isMock) {
    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    const user = users[email.toLowerCase()];
    if (user) {
      user.verified = true;
      users[email.toLowerCase()] = user;
      localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
      
      const { password: _, ...userSession } = user;
      localStorage.setItem('darzzee_mock_session', JSON.stringify(userSession));
      window.dispatchEvent(new Event('mock-session-change'));
    }
  }
}

// 4. Logout user
export async function logoutUser() {
  if (isMock) {
    localStorage.removeItem('darzzee_mock_session');
    window.dispatchEvent(new Event('mock-session-change'));
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 5. Get User Profile
export async function getUserProfile(uid, userEmail, userPhone) {
  if (isMock) {
    const session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
    if (session && session.user_metadata && session.user_metadata.profile) {
      return session.user_metadata.profile;
    }
    return {
      name: session?.user_metadata?.full_name || 'NEW USER',
      email: (userEmail || session?.email || '').toUpperCase(),
      phone: userPhone || session?.user_metadata?.phone || ''
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (data && !error) {
      return {
        name: data.name || '',
        email: (data.email || userEmail || '').toUpperCase(),
        phone: data.phone || userPhone || ''
      };
    }
  } catch (err) {
    console.warn("Failed to fetch profiles table, reading from user_metadata instead.", err);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata && user.user_metadata.profile) {
    const profile = user.user_metadata.profile;
    return {
      name: profile.name || '',
      email: (profile.email || userEmail || '').toUpperCase(),
      phone: profile.phone || userPhone || ''
    };
  }

  return {
    name: user?.user_metadata?.full_name || 'NEW USER',
    email: (userEmail || '').toUpperCase(),
    phone: userPhone || ''
  };
}

// 6. Save User Profile
export async function saveUserProfile(uid, profileData) {
  if (isMock) {
    const session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
    if (session) {
      session.user_metadata = {
        ...session.user_metadata,
        full_name: profileData.name.toUpperCase(),
        phone: profileData.phone,
        profile: {
          name: profileData.name.toUpperCase(),
          email: profileData.email.toUpperCase(),
          phone: profileData.phone
        }
      };
      localStorage.setItem('darzzee_mock_session', JSON.stringify(session));

      const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
      if (users[session.email]) {
        users[session.email] = {
          ...users[session.email],
          ...session
        };
        localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
      }
      window.dispatchEvent(new Event('mock-session-change'));
    }
    return;
  }

  let tableSuccess = false;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: uid,
        name: profileData.name.toUpperCase(),
        email: profileData.email.toUpperCase(),
        phone: profileData.phone,
        updated_at: new Date().toISOString()
      });
    if (!error) tableSuccess = true;
  } catch (err) {
    console.warn("Could not save to public.profiles table, updating user_metadata.", err);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const existingMetadata = user?.user_metadata || {};
  const { error } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      full_name: profileData.name.toUpperCase(),
      phone: profileData.phone,
      profile: {
        name: profileData.name.toUpperCase(),
        email: profileData.email.toUpperCase(),
        phone: profileData.phone
      }
    }
  });

  if (error && !tableSuccess) throw error;
}

// 7. Get User Bookings
export async function getUserBookings(uid) {
  if (isMock) {
    const session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
    if (session && session.user_metadata && session.user_metadata.bookings) {
      return session.user_metadata.bookings;
    }
    const globalBookings = JSON.parse(localStorage.getItem('darzzee_global_bookings') || '[]');
    return globalBookings.filter((b) => b.userId === uid || b.userEmail === session?.email);
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('userId', uid)
      .order('timestamp', { ascending: false });

    if (data && !error) {
      return data;
    }
  } catch (err) {
    console.warn("Failed to fetch bookings table, reading from user_metadata instead.", err);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata && user.user_metadata.bookings) {
    return user.user_metadata.bookings;
  }

  return [];
}

// 8. Create Booking
export async function createBooking(uid, bookingData) {
  const completeBooking = {
    id: bookingData.id || 'booking-' + Math.random().toString(36).substring(2, 11),
    ...bookingData,
    userId: uid,
    timestamp: Date.now()
  };

  try {
    const globalBookings = JSON.parse(localStorage.getItem('darzzee_global_bookings') || '[]');
    localStorage.setItem('darzzee_global_bookings', JSON.stringify([completeBooking, ...globalBookings]));
  } catch (err) {
    console.error("Failed to update global local storage bookings", err);
  }

  if (isMock) {
    const session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
    if (session) {
      const existingBookings = session.user_metadata?.bookings || [];
      const updatedBookings = [completeBooking, ...existingBookings];
      session.user_metadata = {
        ...session.user_metadata,
        bookings: updatedBookings
      };
      localStorage.setItem('darzzee_mock_session', JSON.stringify(session));

      const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
      if (users[session.email]) {
        users[session.email] = {
          ...users[session.email],
          ...session
        };
        localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
      }
      window.dispatchEvent(new Event('mock-session-change'));
    }
    return completeBooking;
  }

  let tableSuccess = false;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([completeBooking])
      .select();

    if (data && !error) {
      tableSuccess = true;
      return data[0];
    }
  } catch (err) {
    console.warn("Could not insert to bookings table, saving to user_metadata fallback.", err);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const existingMetadata = user?.user_metadata || {};
  const currentBookings = existingMetadata.bookings || [];
  const updatedBookings = [completeBooking, ...currentBookings];

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      bookings: updatedBookings
    }
  });

  if (updateError && !tableSuccess) {
    throw updateError;
  }

  return completeBooking;
}

// 9. Sign in with Google (OAuth)
export async function signInWithGoogle() {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockGoogleUser = {
      uid: 'google-mock-uid-' + Math.random().toString(36).substring(2, 11),
      email: 'google.user@gmail.com',
      user_metadata: {
        full_name: 'GOOGLE USER',
        phone: '9999988888',
        profile: {
          name: 'GOOGLE USER',
          email: 'google.user@gmail.com',
          phone: '9999988888'
        },
        bookings: []
      }
    };
    
    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    users['google.user@gmail.com'] = { ...mockGoogleUser, password: 'googlepassword' };
    localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
    localStorage.setItem('darzzee_mock_session', JSON.stringify(mockGoogleUser));
    window.dispatchEvent(new Event('mock-session-change'));
    
    return mockGoogleUser;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

// 10. Send Password Reset Email
export async function sendPasswordResetEmail(email) {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '?type=recovery'
  });
  if (error) throw error;
  return data;
}

// 11. Reset Password
export async function resetPassword(newPassword) {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
    if (!session) {
      session = { email: 'google.user@gmail.com', uid: 'mock-google-uid' };
    }
    
    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    if (users[session.email]) {
      users[session.email].password = newPassword;
      localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
    }
    return true;
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
  return data;
}

// 12. Get all bookings for Admin
export async function getAllBookings() {
  if (isMock) {
    try {
      const stored = localStorage.getItem('darzzee_global_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('timestamp', { ascending: false });

    if (data && !error) {
      return data;
    }
  } catch (err) {
    console.warn("Failed to fetch bookings table for admin, reading from global localStorage.", err);
  }

  try {
    const stored = localStorage.getItem('darzzee_global_bookings');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

// 13. Update Booking Status for Admin
export async function updateBookingStatus(bookingId, status) {
  if (isMock) {
    try {
      const globalBookings = JSON.parse(localStorage.getItem('darzzee_global_bookings') || '[]');
      const idx = globalBookings.findIndex((b) => b.id === bookingId);
      if (idx !== -1) {
        globalBookings[idx].status = status;
        localStorage.setItem('darzzee_global_bookings', JSON.stringify(globalBookings));
      }
    } catch (err) {
      console.error("Failed to update global bookings status in local storage", err);
    }
    return true;
  }

  let tableSuccess = false;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: status })
      .eq('id', bookingId)
      .select();

    if (data && !error) {
      tableSuccess = true;
    }
  } catch (err) {
    console.warn("Could not update bookings table, fallback to local storage update.", err);
  }

  try {
    const globalBookings = JSON.parse(localStorage.getItem('darzzee_global_bookings') || '[]');
    const idx = globalBookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      globalBookings[idx].status = status;
      localStorage.setItem('darzzee_global_bookings', JSON.stringify(globalBookings));
    }
  } catch (err) {
    console.error("Failed to update global bookings status in local storage", err);
  }

  return true;
}
