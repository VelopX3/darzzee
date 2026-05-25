import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = ['all', 'suit', 'kurta', 'sherwani', 'blouse', 'lehenga', 'shirt', 'pants'];

export default function TailorsView({
  searchQuery,
  setSearchQuery,
  selectedCategoryTag,
  setSelectedCategoryTag,
  tailors,
  onSelectTailor
}) {
  // Filter logic
  const filteredTailors = tailors.filter((tailor) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      tailor.name.toLowerCase().includes(q) ||
      tailor.city.toLowerCase().includes(q) ||
      tailor.mainSpecialtyBadge.toLowerCase().includes(q) ||
      tailor.specialties.some((s) => s.toLowerCase().includes(q));

    const matchesTag =
      selectedCategoryTag === 'all' ||
      tailor.specialties.includes(selectedCategoryTag);

    return matchesSearch && matchesTag;
  });

  // Framer Motion variants for stagger effects
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="tailors-listing-wrapper">
      {/* Page Header */}
      <div className="page-header-container">
        <h2 className="page-title">BOOK A TAILOR</h2>
        
        {/* Search & Filter Row */}
        <div className="search-filter-wrapper">
          <div className="search-box-container">
            <svg 
              className="search-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
            <input
              id="tailor-search-input"
              type="text"
              placeholder="Search by specialty, location or name..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="categories-tags">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`tag-${cat}`}
                className={`tag-btn ${selectedCategoryTag === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategoryTag(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="tailors-grid-section">
        {filteredTailors.length === 0 ? (
          <div className="no-results" style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            No tailors found matching your search preferences. Try searching for 'suit', 'kurta', or 'lehenga'.
          </div>
        ) : (
          <motion.div 
            className="tailors-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredTailors.map((tailor) => (
              <motion.div 
                key={tailor.id} 
                className="tailor-card"
                variants={cardVariants}
                whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
              >
                <div 
                  className="tailor-card-img" 
                  style={{ backgroundImage: `url('${tailor.image}')` }}
                />
                <div className="tailor-card-content">
                  <div className="tailor-card-name">{tailor.name}, {tailor.city}</div>
                  <div className="tailor-card-badge">{tailor.mainSpecialtyBadge}</div>
                  
                  <div className="tailor-card-meta">
                    <div className="tailor-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg 
                          key={i}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          style={{
                            width: '12px',
                            height: '12px',
                            color: i < Math.floor(parseFloat(tailor.rating)) ? '#ffb400' : '#e5e5e5'
                          }}
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                        </svg>
                      ))}
                      <span className="tailor-stars-text" style={{ marginLeft: '4px' }}>
                        {tailor.rating} ({tailor.reviews})
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>•</div>
                    <div>{tailor.experience} YRS EXP</div>
                  </div>
                  
                  <button 
                    className="tailor-card-btn" 
                    onClick={() => onSelectTailor(tailor)}
                  >
                    Book Now
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
