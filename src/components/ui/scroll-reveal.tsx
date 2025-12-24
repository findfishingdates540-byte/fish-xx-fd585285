import { motion, useInView } from 'framer-motion';
import { useRef, forwardRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
  scale?: number;
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  (
    {
      children,
      className = '',
      delay = 0,
      duration = 0.6,
      direction = 'up',
      distance = 40,
      once = true,
      scale = 1,
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = forwardedRef || internalRef;
    const isInView = useInView(ref as React.RefObject<HTMLDivElement>, { once, margin: '-50px' });

    const getInitialPosition = () => {
      switch (direction) {
        case 'up':
          return { y: distance, x: 0 };
        case 'down':
          return { y: -distance, x: 0 };
        case 'left':
          return { y: 0, x: distance };
        case 'right':
          return { y: 0, x: -distance };
        case 'none':
          return { y: 0, x: 0 };
        default:
          return { y: distance, x: 0 };
      }
    };

    const initial = getInitialPosition();

    return (
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        className={className}
        initial={{
          opacity: 0,
          ...initial,
          scale: scale < 1 ? scale : 1,
        }}
        animate={{
          opacity: isInView ? 1 : 0,
          y: isInView ? 0 : initial.y,
          x: isInView ? 0 : initial.x,
          scale: isInView ? 1 : scale < 1 ? scale : 1,
        }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    );
  }
);

ScrollReveal.displayName = 'ScrollReveal';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  (
    {
      children,
      className = '',
      staggerDelay = 0.1,
      once = true,
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = forwardedRef || internalRef;
    const isInView = useInView(ref as React.RefObject<HTMLDivElement>, { once, margin: '-50px' });

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        },
      },
    };

    return (
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        className={className}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerContainer.displayName = 'StaggerContainer';

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  (
    {
      children,
      className = '',
      direction = 'up',
      distance = 30,
    },
    ref
  ) => {
    const getInitialPosition = () => {
      switch (direction) {
        case 'up':
          return { y: distance, x: 0 };
        case 'down':
          return { y: -distance, x: 0 };
        case 'left':
          return { y: 0, x: distance };
        case 'right':
          return { y: 0, x: -distance };
        default:
          return { y: distance, x: 0 };
      }
    };

    const initial = getInitialPosition();

    const itemVariants = {
      hidden: {
        opacity: 0,
        ...initial,
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1] as const,
        },
      },
    };

    return (
      <motion.div ref={ref} className={className} variants={itemVariants}>
        {children}
      </motion.div>
    );
  }
);

StaggerItem.displayName = 'StaggerItem';
