import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import img1 from '../assets/backgroundimage.jpg';
import img2 from '../assets/bg-image-main.jpg';
import img3 from '../assets/hero.jpeg';
import img4 from '../assets/Dreamjob.jpeg';
import img5 from '../assets/calltoaction.jpg';
import img6 from '../assets/image-gall.jpg';
import img7 from '../assets/app_main_img.png';
import img11 from '../assets/hero-image.jpeg';
import img8 from '../assets/DEEmploymint.png';
import img9 from '../assets/backgroundimage.jpg';   // replace with your own image
import img10 from '../assets/hero.jpeg';             // replace with your own image

const slides = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11];

const INTERVAL = 10000; // 10 seconds

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

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

  // Auto-scroll every 10 seconds
  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <section
        className="relative overflow-hidden mx-2 sm:mx-4 my-4 sm:my-6 lg:mx-8 lg:my-10 rounded-2xl sm:rounded-3xl shadow-2xl h-[55vw] min-h-[220px] max-h-[900px] sm:h-[60vh] sm:min-h-[380px] lg:h-[75vh] lg:min-h-[500px]"
      >
        {/* Slides */}
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
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </AnimatePresence>

        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20 rounded-2xl sm:rounded-3xl pointer-events-none" />

        {/* Prev Button */}
        <button
          onClick={prev}
          className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full p-1.5 sm:p-3 transition-all duration-200 shadow-lg"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={next}
          className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full p-1.5 sm:p-3 transition-all duration-200 shadow-lg"
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
            key={current}
            className="h-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: INTERVAL / 1000, ease: "linear" }}
          />
        </div>
      </section>
    </motion.div>
  );
};

export default Hero;
