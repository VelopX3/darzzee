import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';

import HomeView from './components/HomeView';
import TailorsView from './components/TailorsView';
import BookingView from './components/BookingView';
import AlterationView from './components/AlterationView';
import JoinView from './components/JoinView';
import ProfileView from './components/ProfileView';
import AuthModal from './components/AuthModal';
import AdminView from './components/AdminView';
import CustomCursor from './components/CustomCursor';
import { 
  subscribeToAuthChanges, 
  logoutUser, 
  getUserProfile, 
  saveUserProfile, 
  getUserBookings, 
  createBooking 
} from './supabase';

import tailorImg1 from './assets/tailor-1.jpeg';
import tailorImg2 from './assets/tailor-2.jpeg';
import tailorImg3 from './assets/tailor-3.jpeg';
import tailorImg4 from './assets/tailor-4.jpeg';
import tailorImg5 from './assets/tailor-5.jpeg';
import tailorImg6 from './assets/tailor-6.jpeg';
import tailorImg7 from './assets/tailor-7.jpeg';
import tailorImg8 from './assets/tailor-8.jpeg';
import tailorImg9 from './assets/tailor-9.jpeg';
import tailorImg10 from './assets/tailor-10.jpeg';

// Tailors dataset (12 tailors)
const TAILORS_DATA = [
  {
    id: 'tailor-1',
    name: 'Arjun Sharma',
    city: 'Mumbai',
    specialties: ['suit', 'kurta', 'sherwani', 'pants', 'shirt'],
    tags: ['Bespoke Suits', 'Indian Ethnic', 'Wedding Attire'],
    mainSpecialtyBadge: 'MASTER OF BESPOKE SUITS',
    rating: '4.9',
    reviews: '240',
    experience: '15',
    image: tailorImg1,
    prices: { Suit: 4500, Kurta: 1500, Blouse: 1200, Sherwani: 5500, Lehenga: 6000, Pants: 800, Shirt: 700 },
    gallery: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-2',
    name: 'Rajesh Kumar',
    city: 'Delhi',
    specialties: ['kurta', 'sherwani', 'pants', 'shirt'],
    tags: ['Kurta Expert', 'Sherwani Specialist', 'Indian Ethnic'],
    mainSpecialtyBadge: 'BEST IN KURTA STITCHING',
    rating: '4.9',
    reviews: '240',
    experience: '15',
    image: tailorImg2,
    prices: { Suit: 4000, Kurta: 1500, Blouse: 1100, Sherwani: 4800, Lehenga: 5000, Pants: 750, Shirt: 700 },
    gallery: [
      'https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-3',
    name: 'Priya Das',
    city: 'Kolkata',
    specialties: ['blouse', 'lehenga', 'sari'],
    tags: ['Blouse Specialist', 'Bridal Lehenga', 'Saree Customization'],
    mainSpecialtyBadge: 'EXPERT IN BRIDAL LEHENGA',
    rating: '4.8',
    reviews: '185',
    experience: '12',
    image: tailorImg3,
    prices: { Suit: 3800, Kurta: 1200, Blouse: 1200, Sherwani: 4500, Lehenga: 6000, Pants: 700, Shirt: 650 },
    gallery: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1610030473914-72b380f7d54b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-4',
    name: 'Amit Patel',
    city: 'Ahmedabad',
    specialties: ['sherwani', 'kurta', 'suit'],
    tags: ['Sherwani Specialist', 'Nehru Jackets', 'Festive Wear'],
    mainSpecialtyBadge: 'MASTER OF SHERWANIS',
    rating: '4.7',
    reviews: '92',
    experience: '10',
    image: tailorImg4,
    prices: { Suit: 4200, Kurta: 1400, Blouse: 1000, Sherwani: 5200, Lehenga: 5500, Pants: 800, Shirt: 750 },
    gallery: [
      'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-5',
    name: 'Vikram Singh',
    city: 'Jaipur',
    specialties: ['suit', 'sherwani', 'pants', 'shirt'],
    tags: ['Royal Jodhpurs', 'Bespoke Suits', 'Traditional Jackets'],
    mainSpecialtyBadge: 'ROYAL TAILORING EXPERT',
    rating: '4.9',
    reviews: '310',
    experience: '20',
    image: tailorImg5,
    prices: { Suit: 5000, Kurta: 1600, Blouse: 1300, Sherwani: 6000, Lehenga: 6500, Pants: 900, Shirt: 800 },
    gallery: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-6',
    name: 'Neha Sen',
    city: 'Bangalore',
    specialties: ['blouse', 'lehenga', 'shirt'],
    tags: ['Modern Blouses', 'Designer Gowns', 'Western Tailoring'],
    mainSpecialtyBadge: 'EXPERT IN DESIGNER BLOUSE',
    rating: '4.8',
    reviews: '142',
    experience: '8',
    image: tailorImg6,
    prices: { Suit: 4200, Kurta: 1300, Blouse: 1300, Sherwani: 5000, Lehenga: 6200, Pants: 800, Shirt: 750 },
    gallery: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1610030473914-72b380f7d54b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-7',
    name: 'Kabir Mehta',
    city: 'Delhi',
    specialties: ['shirt', 'pants', 'suit'],
    tags: ['Formal Shirts', 'Trousers', 'Blazers'],
    mainSpecialtyBadge: 'PREMIUM SHIRT & TROUSER',
    rating: '4.6',
    reviews: '76',
    experience: '9',
    image: tailorImg7,
    prices: { Suit: 4300, Kurta: 1300, Blouse: 1100, Sherwani: 4800, Lehenga: 5000, Pants: 850, Shirt: 800 },
    gallery: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-8',
    name: 'Ritu Verma',
    city: 'Lucknow',
    specialties: ['kurta', 'lehenga', 'blouse'],
    tags: ['Chikan Embroidery', 'Kurti Specialist', 'Anarkali Suits'],
    mainSpecialtyBadge: 'TRADITIONAL CHIKANKARI EXPERT',
    rating: '4.9',
    reviews: '218',
    experience: '16',
    image: tailorImg8,
    prices: { Suit: 4000, Kurta: 1600, Blouse: 1200, Sherwani: 5000, Lehenga: 5800, Pants: 800, Shirt: 700 },
    gallery: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1610030473914-72b380f7d54b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-9',
    name: 'Suresh Nair',
    city: 'Chennai',
    specialties: ['kurta', 'shirt', 'pants'],
    tags: ['Veshti & Shirts', 'Traditional Kurta', 'South Indian Ethnic'],
    mainSpecialtyBadge: "TRADITIONAL MEN'S WEAR",
    rating: '4.7',
    reviews: '110',
    experience: '14',
    image: tailorImg9,
    prices: { Suit: 3900, Kurta: 1200, Blouse: 1000, Sherwani: 4600, Lehenga: 4800, Pants: 750, Shirt: 700 },
    gallery: [
      'https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-10',
    name: 'Anjali Hegde',
    city: 'Pune',
    specialties: ['blouse', 'lehenga', 'suit'],
    tags: ['Blouse Specialist', 'Indo-Western Gowns', 'Lehenga'],
    mainSpecialtyBadge: 'EXPERT IN INDO-WESTERN',
    rating: '4.8',
    reviews: '95',
    experience: '11',
    image: tailorImg10,
    prices: { Suit: 4400, Kurta: 1400, Blouse: 1250, Sherwani: 5100, Lehenga: 6000, Pants: 800, Shirt: 750 },
    gallery: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1610030473914-72b380f7d54b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-11',
    name: 'Kiran Rao',
    city: 'Hyderabad',
    specialties: ['suit', 'pants', 'shirt'],
    tags: ['Bespoke Suits', 'Tuxedos', 'Blazers'],
    mainSpecialtyBadge: 'MASTER OF TUXEDOS',
    rating: '4.9',
    reviews: '158',
    experience: '13',
    image: tailorImg1,
    prices: { Suit: 4800, Kurta: 1500, Blouse: 1100, Sherwani: 5500, Lehenga: 5500, Pants: 900, Shirt: 800 },
    gallery: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tailor-12',
    name: 'Rahul Roy',
    city: 'Kolkata',
    specialties: ['kurta', 'sherwani', 'shirt'],
    tags: ['Interactive Tailoring', 'Authentic Sherwani', 'Premium Casuals'],
    mainSpecialtyBadge: 'BEST IN MENS ETHNIC',
    rating: '4.7',
    reviews: '89',
    experience: '10',
    image: tailorImg2,
    prices: { Suit: 4000, Kurta: 1200, Blouse: 1000, Sherwani: 4800, Lehenga: 5000, Pants: 750, Shirt: 700 },
    gallery: [
      'https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

export default function App() {
  // Initialize Lenis smooth scrolling on mount
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      window.lenis = null;
    };
  }, []);

  const [tailors, setTailors] = useState(() => {
    const stored = localStorage.getItem('darzzee_tailors');
    return stored ? JSON.parse(stored) : TAILORS_DATA;
  });

  const [activeView, setActiveView] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Resize Lenis on active view transitions to ensure correct scrolling bounds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.lenis?.resize();
    }, 120);
    return () => clearTimeout(timer);
  }, [activeView]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTag, setSelectedCategoryTag] = useState('all');
  const [activeTailorForBooking, setActiveTailorForBooking] = useState(() => {
    const stored = localStorage.getItem('darzzee_tailors');
    const parsed = stored ? JSON.parse(stored) : TAILORS_DATA;
    return parsed[0];
  });

  // CRUD Handlers for Partner Tailors
  const handleAddTailor = (newTailor) => {
    const updated = [...tailors, newTailor];
    setTailors(updated);
    localStorage.setItem('darzzee_tailors', JSON.stringify(updated));
  };

  const handleEditTailor = (updatedTailor) => {
    const updated = tailors.map(t => t.id === updatedTailor.id ? updatedTailor : t);
    setTailors(updated);
    localStorage.setItem('darzzee_tailors', JSON.stringify(updated));
  };

  const handleDeleteTailor = (tailorId) => {
    const updated = tailors.filter(t => t.id !== tailorId);
    setTailors(updated);
    localStorage.setItem('darzzee_tailors', JSON.stringify(updated));
    if (activeTailorForBooking && activeTailorForBooking.id === tailorId) {
      setActiveTailorForBooking(updated[0] || null);
    }
  };

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState('00:00:00');
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Authentication states
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authModalMode, setAuthModalMode] = useState('SIGN_IN');

  // Listen for reset/recovery redirect hooks
  useEffect(() => {
    const handleUrlHash = () => {
      const hash = window.location.hash || window.location.search;
      if (hash.includes('type=recovery') || hash.includes('recovery')) {
        setAuthModalMode('RESET_PASSWORD');
      }
    };
    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);
    return () => window.removeEventListener('hashchange', handleUrlHash);
  }, []);

  // User Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Bookings list state
  const [bookings, setBookings] = useState([]);

  // Subscribe to authentication changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoadingAuth(false);
        try {
          const fetchedProfile = await getUserProfile(user.uid, user.email, user.phoneNumber);
          setProfile(fetchedProfile);
          
          const fetchedBookings = await getUserBookings(user.uid);
          setBookings(fetchedBookings);
        } catch (err) {
          console.error("Error loading user profile or bookings:", err);
        }
      } else {
        setCurrentUser(null);
        setProfile({ name: '', email: '', phone: '' });
        setBookings([]);
        setLoadingAuth(false);
      }
    });
    return unsubscribe;
  }, []);

  // Update profile handler
  const handleUpdateProfile = async (newProfile) => {
    if (!currentUser) return;
    try {
      await saveUserProfile(currentUser.uid, newProfile);
      setProfile(newProfile);
      showToast('PROFILE DETAILS SAVED SUCCESSFULLY!');
    } catch (err) {
      console.error(err);
      showToast('FAILED TO SAVE PROFILE DETAILS.');
    }
  };

  // Add booking handler
  const handleAddBooking = async (bookingData) => {
    if (!currentUser) return;
    try {
      await createBooking(currentUser.uid, bookingData);
      // Fetch fresh bookings list to update state
      const fetchedBookings = await getUserBookings(currentUser.uid);
      setBookings(fetchedBookings);
      showToast('BOOKING PLACED SUCCESSFULLY!');
    } catch (err) {
      console.error(err);
      showToast('FAILED TO PLACE BOOKING.');
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logoutUser();
      showToast('SIGNED OUT SUCCESSFULLY!');
      navigateTo('home');
    } catch (err) {
      console.error(err);
      showToast('FAILED TO SIGN OUT!');
    }
  };

  // Real-time clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      let seconds = now.getSeconds();
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toast Notification Spawner
  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Nav Router function
  const navigateTo = (viewId, scrollDownToBookings = false) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false); // Close mobile drawer menu
    if (viewId === 'profile' && scrollDownToBookings) {
      setTimeout(() => {
        const historyHeader = document.querySelector('.booking-history-title');
        if (historyHeader) {
          if (window.lenis) {
            window.lenis.scrollTo(historyHeader, { duration: 1.2 });
          } else {
            historyHeader.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 150);
    } else {
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0 });
      }
    }
  };

  // Select tailor & nav to checkout
  const selectTailor = (tailor) => {
    setActiveTailorForBooking(tailor);
    navigateTo('booking');
  };

  // Switch filter tags & go to tailors list
  const filterByCategory = (category) => {
    setSelectedCategoryTag(category);
    navigateTo('tailors');
  };

  // Search focus routing
  const focusSearch = () => {
    navigateTo('tailors');
    setTimeout(() => {
      const searchInput = document.getElementById('tailor-search-input');
      if (searchInput) searchInput.focus();
    }, 150);
  };

  // Page switcher mapper
  const renderViewContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView
            onSelectCategory={filterByCategory}
            onSelectTailor={selectTailor}
            tailors={tailors}
            showToast={showToast}
          />
        );
      case 'tailors':
        return (
          <TailorsView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategoryTag={selectedCategoryTag}
            setSelectedCategoryTag={setSelectedCategoryTag}
            tailors={tailors}
            onSelectTailor={selectTailor}
          />
        );
      case 'booking':
        return (
          <BookingView
            tailor={activeTailorForBooking}
            showToast={showToast}
            addBooking={handleAddBooking}
            navigateTo={navigateTo}
          />
        );
      case 'alteration':
        return (
          <AlterationView
            showToast={showToast}
            navigateTo={navigateTo}
          />
        );
      case 'join':
        return (
          <JoinView
            showToast={showToast}
          />
        );
      case 'profile':
        return (
          <ProfileView
            profile={profile}
            setProfile={handleUpdateProfile}
            bookings={bookings}
            showToast={showToast}
            onSignOut={handleSignOut}
          />
        );
      case 'admin':
        return (
          <AdminView
            tailors={tailors}
            currentUser={currentUser}
            onAddTailor={handleAddTailor}
            onEditTailor={handleEditTailor}
            onDeleteTailor={handleDeleteTailor}
            showToast={showToast}
            tailorImages={[
              tailorImg1, tailorImg2, tailorImg3, tailorImg4, tailorImg5,
              tailorImg6, tailorImg7, tailorImg8, tailorImg9, tailorImg10
            ]}
          />
        );
      default:
        return (
          <HomeView
            onSelectCategory={filterByCategory}
            onSelectTailor={selectTailor}
            tailors={tailors}
            showToast={showToast}
          />
        );
    }
  };

  // Top banner announce text dynamic changes
  const bannerText = activeView === 'home'
    ? '— DOOR TO DOOR TAILOR SERVICE, NOW IN ALPHA — DOOR TO DOOR TAILOR SERVICE, NOW IN ALPHA — DOOR TO DOOR TAILOR SERVICE, NOW IN ALPHA —'
    : '- SAVE 10% WITH CODE SAVE10 -       - FREE SHIPPING ON ORDERS OVER £150 -       - SAVE 10% WITH CODE SAVE10 -       - FREE SHIPPING ON ORDERS OVER £150 -';

  if (loadingAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#faf9f6',
        color: '#000000',
        fontFamily: 'var(--font-display)',
        fontSize: '24px',
        fontWeight: '900',
        letterSpacing: '0.1em'
      }}>
        LOADING...
      </div>
    );
  }

  if (!currentUser || authModalMode === 'RESET_PASSWORD') {
    return (
      <>
        <AuthModal 
          initialMode={authModalMode}
          onAuthSuccess={() => {
            setAuthModalMode('SIGN_IN');
            navigateTo('home');
          }}
          onCloseMode={() => {
            window.history.replaceState(null, '', window.location.pathname);
            setAuthModalMode('SIGN_IN');
          }}
          showToast={showToast}
        />
        <div id="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              {t.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div id="app-container">
      <CustomCursor />
      {/* Dynamic Announcement Banner */}
      <div className={`announcement-banner ${activeView === 'home' ? 'dark' : ''}`}>
        <div id="announcement-content" className="announcement-text">
          {bannerText}
        </div>
      </div>

      {/* Header Navigation */}
      <header>
        <div className="header-top">
          <div className="logo-container" onClick={() => navigateTo('home')}>
            <h1 id="app-logo-text">DARZZEE</h1>
          </div>
          <div className="header-meta">
            <div className="location">INDIA, IN</div>
            <div id="live-clock" className="clock">{currentTime}</div>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? 'CLOSE ×' : 'MENU ☰'}
          </button>
        </div>
        <div className="header-divider"></div>
        <nav className="header-nav">
          <div className="nav-links">
            <button
              id="nav-home"
              onClick={() => navigateTo('home')}
              className={activeView === 'home' ? 'active' : ''}
            >
              HOME
            </button>
            <button
              id="nav-book"
              onClick={() => navigateTo('tailors')}
              className={activeView === 'tailors' ? 'active' : ''}
            >
              BOOK TAILOR
            </button>
            <button
              id="nav-alteration"
              onClick={() => navigateTo('alteration')}
              className={activeView === 'alteration' ? 'active' : ''}
            >
              ALTER SERVICE
            </button>
            <button
              id="nav-join"
              onClick={() => navigateTo('join')}
              className={activeView === 'join' ? 'active' : ''}
            >
              JOIN AS TAILOR
            </button>
          </div>
          <div className="nav-actions">
            <button onClick={focusSearch}>SEARCH</button>
            <button 
              id="nav-profile"
              onClick={() => navigateTo('profile')}
              className={activeView === 'profile' ? 'active' : ''}
            >
              PROFILE
            </button>
            <button onClick={() => navigateTo('profile', true)}>
              BOOKINGS <span id="cart-badge-count" className="cart-count">{bookings.length}</span>
            </button>
          </div>
        </nav>
        <div className="header-divider"></div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              className="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              className="mobile-menu-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            >
              <div className="mobile-menu-header">
                <div className="logo-container" onClick={() => navigateTo('home')}>
                  <h1 className="mobile-menu-logo">DARZZEE</h1>
                </div>
                <button 
                  className="mobile-menu-close" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="mobile-menu-links">
                <button
                  className={activeView === 'home' ? 'active' : ''}
                  onClick={() => navigateTo('home')}
                >
                  HOME
                </button>
                <button
                  className={activeView === 'tailors' ? 'active' : ''}
                  onClick={() => navigateTo('tailors')}
                >
                  BOOK TAILOR
                </button>
                <button
                  className={activeView === 'alteration' ? 'active' : ''}
                  onClick={() => navigateTo('alteration')}
                >
                  ALTER SERVICE
                </button>
                <button
                  className={activeView === 'join' ? 'active' : ''}
                  onClick={() => navigateTo('join')}
                >
                  JOIN AS TAILOR
                </button>
                
                <div className="mobile-menu-divider"></div>
                
                <button onClick={() => { setIsMobileMenuOpen(false); focusSearch(); }}>
                  SEARCH
                </button>
                <button
                  className={activeView === 'profile' ? 'active' : ''}
                  onClick={() => navigateTo('profile')}
                >
                  PROFILE
                </button>
                <button onClick={() => navigateTo('profile', true)}>
                  BOOKINGS <span className="cart-count" style={{ display: 'inline', marginLeft: '6px', position: 'static' }}>{bookings.length}</span>
                </button>
                
                {currentUser && currentUser.email && currentUser.email.toLowerCase() === 'admin@darzzee.com' && (
                  <button
                    className={activeView === 'admin' ? 'active' : ''}
                    onClick={() => navigateTo('admin')}
                  >
                    ADMIN PANEL
                  </button>
                )}
              </div>
              
              <div className="mobile-menu-footer">
                <div>INDIA, IN</div>
                <div>{currentTime}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main View Container with Framer Motion transitions */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="view-section active"
          >
            {renderViewContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Footer */}
      <footer>
        <div className="footer-nav">
          <div className="footer-links">
            <a href="javascript:void(0)" onClick={() => navigateTo('home')}>Home</a>
            <a href="javascript:void(0)" onClick={() => navigateTo('tailors')}>Tailors</a>
            <a href="javascript:void(0)" onClick={() => navigateTo('alteration')}>Alterations</a>
            <a href="javascript:void(0)" onClick={() => navigateTo('join')}>Join Us</a>
            <a href="javascript:void(0)" onClick={() => navigateTo('profile')}>Profile</a>
            {currentUser && currentUser.email && currentUser.email.toLowerCase() === 'admin@darzzee.com' && (
              <a href="javascript:void(0)" onClick={() => navigateTo('admin')} id="footer-admin-link">Admin</a>
            )}
          </div>
          <form className="footer-signup" onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.elements.newsletterEmail;
            if (input && input.value) {
              showToast(`Subscribed with ${input.value}!`);
              input.value = '';
            }
          }}>
            <input
              type="email"
              name="newsletterEmail"
              placeholder="YOUR EMAIL ADDRESS"
              className="signup-input"
              required
            />
            <button type="submit" className="signup-btn">
              Notify Me
            </button>
          </form>
        </div>
        <div className="footer-copyright">
          <div 
            onDoubleClick={() => navigateTo('admin')} 
            style={{ cursor: 'pointer' }}
            title="Double-click for administrative access"
          >
            DARZZEE © 2026
          </div>
          <div className="footer-copyright-center">BOUTIQUE CUSTOM TAILOR SERVICE</div>
          <div>MADE WITH CARE</div>
        </div>
      </footer>

      {/* React Toast Container */}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
