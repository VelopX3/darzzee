// Seed catalogue of partner tailors. Admin edits are stored in the admin's
// browser (localStorage) — see AdminView. A shared tailors table in Supabase
// is required for edits to be visible to every customer.
import t1_400 from '../assets/img/tailor-1-400.webp';
import t1_800 from '../assets/img/tailor-1-800.webp';
import t2_400 from '../assets/img/tailor-2-400.webp';
import t2_800 from '../assets/img/tailor-2-800.webp';
import t3_400 from '../assets/img/tailor-3-400.webp';
import t3_800 from '../assets/img/tailor-3-800.webp';
import t4_400 from '../assets/img/tailor-4-400.webp';
import t4_800 from '../assets/img/tailor-4-800.webp';
import t5_400 from '../assets/img/tailor-5-400.webp';
import t5_800 from '../assets/img/tailor-5-800.webp';
import t6_400 from '../assets/img/tailor-6-400.webp';
import t6_800 from '../assets/img/tailor-6-800.webp';
import t7_400 from '../assets/img/tailor-7-400.webp';
import t7_800 from '../assets/img/tailor-7-800.webp';
import t8_400 from '../assets/img/tailor-8-400.webp';
import t8_800 from '../assets/img/tailor-8-800.webp';
import t9_400 from '../assets/img/tailor-9-400.webp';
import t9_800 from '../assets/img/tailor-9-800.webp';
import t10_400 from '../assets/img/tailor-10-400.webp';
import t10_800 from '../assets/img/tailor-10-800.webp';

export const TAILOR_IMAGES = [
  { src: t1_800, srcSet: `${t1_400} 400w, ${t1_800} 800w` },
  { src: t2_800, srcSet: `${t2_400} 400w, ${t2_800} 800w` },
  { src: t3_800, srcSet: `${t3_400} 400w, ${t3_800} 800w` },
  { src: t4_800, srcSet: `${t4_400} 400w, ${t4_800} 800w` },
  { src: t5_800, srcSet: `${t5_400} 400w, ${t5_800} 800w` },
  { src: t6_800, srcSet: `${t6_400} 400w, ${t6_800} 800w` },
  { src: t7_800, srcSet: `${t7_400} 400w, ${t7_800} 800w` },
  { src: t8_800, srcSet: `${t8_400} 400w, ${t8_800} 800w` },
  { src: t9_800, srcSet: `${t9_400} 400w, ${t9_800} 800w` },
  { src: t10_800, srcSet: `${t10_400} 400w, ${t10_800} 800w` }
];

function tailorImage(n) {
  const img = TAILOR_IMAGES[n - 1];
  return { image: img.src, imageSrcSet: img.srcSet };
}

export const TAILORS_DATA = [
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
    ...tailorImage(1),
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
    ...tailorImage(2),
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
    ...tailorImage(3),
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
    ...tailorImage(4),
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
    ...tailorImage(5),
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
    ...tailorImage(6),
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
    ...tailorImage(7),
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
    ...tailorImage(8),
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
    ...tailorImage(9),
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
    ...tailorImage(10),
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
    ...tailorImage(1),
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
    ...tailorImage(2),
    prices: { Suit: 4000, Kurta: 1200, Blouse: 1000, Sherwani: 4800, Lehenga: 5000, Pants: 750, Shirt: 700 },
    gallery: [
      'https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

export const GARMENTS = ['suit', 'kurta', 'sherwani', 'blouse', 'lehenga', 'shirt', 'pants', 'sari'];

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

/** Props for an <img> showing a tailor portrait (handles custom admin URLs). */
export function tailorImgProps(tailor) {
  if (!tailor?.image) return { src: TAILOR_IMAGES[0].src, srcSet: TAILOR_IMAGES[0].srcSet };
  return tailor.imageSrcSet ? { src: tailor.image, srcSet: tailor.imageSrcSet } : { src: tailor.image };
}

const STORAGE_KEY = 'darzzee_tailors';

/**
 * Loads the admin-edited catalogue if present. Image URLs saved by older
 * builds point at hashed asset files that no longer exist, so built-in
 * portraits are re-mapped to the current optimized images.
 */
export function loadTailors() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    stored = null;
  }
  if (!Array.isArray(stored) || stored.length === 0) return TAILORS_DATA;
  return stored
    .filter((t) => t && t.id && t.name && Array.isArray(t.specialties))
    .map((t) => {
      const legacy = typeof t.image === 'string' && t.image.match(/\/assets\/tailor-(\d+)[-.]/);
      if (legacy && !TAILOR_IMAGES.some((img) => img.src === t.image)) {
        const img = TAILOR_IMAGES[Number(legacy[1]) - 1];
        if (img) return { ...t, image: img.src, imageSrcSet: img.srcSet };
      }
      return t;
    });
}

export function saveTailors(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage full or unavailable */
  }
}
