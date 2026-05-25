import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if we are running with mock keys
export const isMock = !supabaseUrl || supabaseUrl.includes('mock') || !supabaseAnonKey || supabaseAnonKey.includes('mock');

// --- WRAPPER API FUNCTIONS ---

// 1. Subscribe to Auth changes
export function subscribeToAuthChanges(callback) {
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.toUpperCase(),
        phone: phone,
        // Also save profile and bookings locally inside user metadata as fallback database!
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
  
  // Try inserting into public.profiles if it exists, ignore if table is missing
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data.user;
}

// 4. Logout user
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 5. Get User Profile
export async function getUserProfile(uid, userEmail, userPhone) {
  // First try fetching from public.profiles table
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

  // Fallback: Read from user_metadata
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata && user.user_metadata.profile) {
    const profile = user.user_metadata.profile;
    return {
      name: profile.name || '',
      email: (profile.email || userEmail || '').toUpperCase(),
      phone: profile.phone || userPhone || ''
    };
  }

  // Double Fallback
  return {
    name: user?.user_metadata?.full_name || 'NEW USER',
    email: (userEmail || '').toUpperCase(),
    phone: userPhone || ''
  };
}

// 6. Save User Profile
export async function saveUserProfile(uid, profileData) {
  // Update profiles table if it exists
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

  // Always update auth metadata as well, so metadata is always in sync
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
  // Try reading from bookings table
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

  // Fallback: Read from user_metadata
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata && user.user_metadata.bookings) {
    return user.user_metadata.bookings;
  }

  return [];
}

// 8. Create Booking
export async function createBooking(uid, bookingData) {
  const completeBooking = {
    ...bookingData,
    userId: uid,
    timestamp: Date.now()
  };

  // Save to global local storage bookings for mock admin display
  try {
    const globalBookings = JSON.parse(localStorage.getItem('darzzee_global_bookings') || '[]');
    localStorage.setItem('darzzee_global_bookings', JSON.stringify([completeBooking, ...globalBookings]));
  } catch (err) {
    console.error("Failed to update global local storage bookings", err);
  }

  // Try writing to bookings table
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

  // Fallback: Save in user_metadata
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
    // Simulated Google Login
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockGoogleUser = {
      uid: 'google-mock-uid-' + Math.random().toString(36).substring(2, 11),
      email: 'google.user@gmail.com',
      displayName: 'GOOGLE USER',
      phoneNumber: '9999988888',
      createdAt: new Date().toISOString()
    };
    
    // Save user & session in localStorage
    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    users['google.user@gmail.com'] = { ...mockGoogleUser, password: 'googlepassword' };
    localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
    localStorage.setItem('darzzee_mock_session', JSON.stringify(mockGoogleUser));
    window.dispatchEvent(new Event('storage'));
    
    return mockGoogleUser;
  } else {
    // Real Supabase Google Login
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  }
}

// 10. Send Password Reset Email
export async function sendPasswordResetEmail(email) {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Simulated success
    return true;
  } else {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '?type=recovery'
    });
    if (error) throw error;
    return data;
  }
}

// 11. Reset Password
export async function resetPassword(newPassword) {
  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Get active session
    let session = JSON.parse(localStorage.getItem('darzzee_mock_session'));
    if (!session) {
      // Fallback: use a placeholder mock user if they want to test password reset directly
      session = { email: 'google.user@gmail.com', uid: 'mock-google-uid' };
    }
    
    // Update password in mock storage
    const users = JSON.parse(localStorage.getItem('darzzee_mock_users') || '{}');
    if (users[session.email]) {
      users[session.email].password = newPassword;
      localStorage.setItem('darzzee_mock_users', JSON.stringify(users));
    }
    return true;
  } else {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
}

// 12. Get all bookings for Admin
export async function getAllBookings() {
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

  // Fallback to local storage global bookings
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

  // Fallback / local update: global local storage bookings
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

