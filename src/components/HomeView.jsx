import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import heroVideo from '../assets/hero-video.mp4';
import kurtaImg from '../assets/kurta.jpeg';
import sherwaniImg from '../assets/sherwani.jpeg';
import blouseImg from '../assets/blouse.jpeg';
import lehengaImg from '../assets/lehenga.jpeg';

export default function HomeView({ onSelectCategory, onSelectTailor, tailors, showToast }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // 4 tailors per slide page
  const itemsPerSlide = 4;
  const totalSlides = Math.ceil(tailors.length / itemsPerSlide);

  const getSlideItems = () => {
    const start = activeSlide * itemsPerSlide;
    return tailors.slice(start, start + itemsPerSlide);
  };

  const handleDotClick = (index) => {
    setActiveSlide(index);
    showToast(`Featured Page ${index + 1}`);
  };

  // Stagger animation variants for category cards
  const categoryContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const categoryCardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 150, damping: 15 } 
    }
  };

  return (
    <div className="home-view-wrapper">
      {/* Hero Section */}
      <div className="hero-section">
        <video 
          src={heroVideo} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="hero-video-bg" 
        />
        <div className="hero-content">
          <motion.div 
            className="hero-title-group"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2>DARZZEE</h2>
            <p>DOOR TO DOOR CUSTOM TAILOR SERVICE</p>
          </motion.div>
          
          <motion.button 
            className="hero-btn" 
            onClick={() => onSelectCategory('all')}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 12 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            BOOK NOW
          </motion.button>
        </div>
      </div>

      {/* Sub Hero Ticker / Banner */}
      <div className="sub-hero-ticker">
        <div className="ticker-track">
          <span>— HIGH-QUALITY CUSTOM FITTING</span>
          <span>— DOORSTEP CONSULTATION</span>
          <span>— TAILOR DELIVERY SERVICE</span>
          <span>— HIGH-QUALITY CUSTOM FITTING</span>
          <span>— DOORSTEP CONSULTATION</span>
          <span>— TAILOR DELIVERY SERVICE</span>
        </div>
      </div>

      {/* Welcome Message */}
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span 
          className="welcome-logo"
          animate={{ rotate: [0, 6, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          [D]
        </motion.span>
        <h3>WELCOME TO DARZZEE. EXPLORE THE CATALOG.</h3>
        <p>A premium custom tailoring service from design to doorstep.</p>
      </motion.div>

      {/* Categories Cards */}
      <motion.div 
        className="categories-container"
        variants={categoryContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div 
          className="category-card"
          variants={categoryCardVariants}
          whileHover={{ scale: 1.05, y: -6, boxShadow: '0px 12px 25px rgba(0,0,0,0.15)' }}
          style={{ backgroundImage: `url('${kurtaImg}')` }}
          onClick={() => onSelectCategory('kurta')}
        >
          <button className="category-badge">
            KURTA
          </button>
        </motion.div>
        
        <motion.div 
          className="category-card"
          variants={categoryCardVariants}
          whileHover={{ scale: 1.05, y: -6, boxShadow: '0px 12px 25px rgba(0,0,0,0.15)' }}
          style={{ backgroundImage: `url('${sherwaniImg}')` }}
          onClick={() => onSelectCategory('sherwani')}
        >
          <button className="category-badge">
            SHERWANI
          </button>
        </motion.div>
        
        <motion.div 
          className="category-card"
          variants={categoryCardVariants}
          whileHover={{ scale: 1.05, y: -6, boxShadow: '0px 12px 25px rgba(0,0,0,0.15)' }}
          style={{ backgroundImage: `url('${blouseImg}')` }}
          onClick={() => onSelectCategory('blouse')}
        >
          <button className="category-badge">
            BLOUSE
          </button>
        </motion.div>
        
        <motion.div 
          className="category-card"
          variants={categoryCardVariants}
          whileHover={{ scale: 1.05, y: -6, boxShadow: '0px 12px 25px rgba(0,0,0,0.15)' }}
          style={{ backgroundImage: `url('${lehengaImg}')` }}
          onClick={() => onSelectCategory('lehenga')}
        >
          <button className="category-badge">
            LEHENGA
          </button>
        </motion.div>
      </motion.div>

      {/* Featured Tailors Showcase */}
      <div className="featured-tailors-section">
        <h4 className="featured-title">FEATURED TAILORS</h4>
        
        {/* Tailors Row with Carousel transitions */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSlide}
              className="featured-carousel"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {getSlideItems().map((tailor) => (
                <motion.div 
                  key={tailor.id}
                  className="featured-item"
                  style={{ backgroundImage: `url('${tailor.image}')` }}
                  onClick={() => onSelectTailor(tailor)}
                  whileHover={{ scale: 1.05, y: -4 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div 
              key={idx}
              className={`indicator ${activeSlide === idx ? 'active' : ''}`}
              onClick={() => handleDotClick(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
