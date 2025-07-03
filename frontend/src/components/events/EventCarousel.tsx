import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import EventCard from './EventCard';
import { Event } from '../../types';

interface EventCarouselProps {
  events: Event[];
}

const EventCarousel = ({ events }: EventCarouselProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const currentX = useRef(0);
  const totalDistance = useRef(0);
  const baseDuration = 60; // Base duration in seconds

  // Calculate container and content widths
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      setContentWidth(containerRef.current.scrollWidth);
      totalDistance.current = containerRef.current.scrollWidth - containerRef.current.offsetWidth;
    }
  }, [events]);

  // Track current position
  useEffect(() => {
    const unsubscribe = x.onChange((latest) => {
      currentX.current = latest;
    });
    return () => unsubscribe();
  }, [x]);

  // Calculate remaining duration based on current position
  const calculateRemainingDuration = (currentPosition: number) => {
    const totalDistance = contentWidth - containerWidth;
    const remainingDistance = Math.abs(currentPosition) + totalDistance;
    const progress = Math.abs(currentPosition) / totalDistance;
    return baseDuration * (1 - progress);
  };

  // Auto-scroll animation with position memory and speed preservation
  useEffect(() => {
    if (!isHovered && containerWidth < contentWidth) {
      const startPosition = currentX.current;
      const targetPosition = -contentWidth + containerWidth;
      const remainingDuration = calculateRemainingDuration(startPosition);
      
      controls.start({
        x: [startPosition, targetPosition],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: remainingDuration,
            ease: "linear",
            from: startPosition,
            to: targetPosition,
          },
        },
      });
    } else {
      controls.stop();
    }
  }, [isHovered, containerWidth, contentWidth, controls]);

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-[#101119] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#101119] to-transparent z-10" />

      {/* Carousel container */}
      <motion.div
        ref={containerRef}
        className="flex gap-8 px-4"
        animate={controls}
        style={{ x }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Original events */}
        {events.map((event) => (
          <motion.div
            key={event.id}
            className="flex-none w-[220px] sm:w-[280px] md:w-[350px]"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}

        {/* Duplicate events for seamless loop */}
        {events.map((event) => (
          <motion.div
            key={`duplicate-${event.id}`}
            className="flex-none w-[220px] sm:w-[280px] md:w-[350px]"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default EventCarousel; 