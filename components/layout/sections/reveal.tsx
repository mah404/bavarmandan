"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

export const Reveal = ({ children, className, delay = 0, ...props }: RevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const HoverLift = ({ children, className, ...props }: RevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MotionList = ({ children, className, delay = 0, ...props }: RevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : 0.035,
            delayChildren: delay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MotionItem = ({ children, className, ...props }: RevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: shouldReduceMotion ? {} : { opacity: 0, y: 10 },
        show: shouldReduceMotion ? {} : { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FloatInPlace = ({ children, className, delay = 0, ...props }: RevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={shouldReduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={{
        duration: 7,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MotionButton = ({ children, className, ...props }: RevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
