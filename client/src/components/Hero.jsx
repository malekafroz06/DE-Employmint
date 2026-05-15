import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import img1 from '../assets/hero (1).jpeg';
import img2 from '../assets/hero (2).jpeg';
import img3 from '../assets/hero (3).jpeg';

const slides = [img1, img2, img3];

const INTERVAL = 10000; // 10 seconds

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isVisible, setIsVisible] = useState(true); // 👈 track visibility
  const sectionRef = useRef(null); // 👈 ref for the section

  const goTo = useCallback((index, dir = 1) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, -1);
  }, [current, goTo]);

  // 👇 Observe when the section enters/leaves the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 } // 30% of the section must be visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 👇 Auto-scroll only when visible
  useEffect(() => {
    if (!isVisible) return; // pause if not visible

    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next, isVisible]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      ref={sectionRef} // 👈 attach ref here
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
  <section className="relative overflow-hidden mx-2 sm:mx-4 my-4 sm:my-6 lg:mx-8 lg:my-10 rounded-2xl sm:rounded-3xl border-2 border-gray-300">
  
  {/* Fixed aspect ratio wrapper — prevents white gap */}
  <div className="relative w-full" style={{ paddingBottom: "42%" }}>
    
    <AnimatePresence initial={false} custom={direction}>
      <motion.img
        key={current}
        src={slides[current]}
        alt={`Slide ${current + 1}`}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </AnimatePresence>

    {/* Prev Button */}
    <button
      onClick={prev}
      className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/90 backdrop-blur-sm text-black rounded-full p-1.5 sm:p-3 transition-all duration-200 shadow-lg"
      aria-label="Previous slide"
    >
      <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
    </button>

    {/* Next Button */}
    <button
      onClick={next}
      className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/90 backdrop-blur-sm text-black rounded-full p-1.5 sm:p-3 transition-all duration-200 shadow-lg"
      aria-label="Next slide"
    >
      <ChevronRight size={18} className="sm:w-6 sm:h-6" />
    </button>

    {/* Dot indicators */}
    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2">
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => goTo(i, i > current ? 1 : -1)}
          aria-label={`Go to slide ${i + 1}`}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "bg-white w-4 sm:w-6 h-1.5 sm:h-2.5"
              : "bg-white/50 hover:bg-white/75 w-1.5 sm:w-2.5 h-1.5 sm:h-2.5"
          }`}
        />
      ))}
    </div>

    {/* Progress bar */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10 rounded-b-3xl overflow-hidden">
      <motion.div
        key={`${current}-${isVisible}`}
        className="h-full bg-white"
        initial={{ width: "0%" }}
        animate={isVisible ? { width: "100%" } : { width: "0%" }}
        transition={isVisible ? { duration: INTERVAL / 1000, ease: "linear" } : { duration: 0 }}
      />
    </div>

  </div>
</section>
    </motion.div>
  );
};

export default Hero;