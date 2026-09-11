"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Presentational scroll-reveal wrapper — fades and rises content into view
 * the first time it scrolls into the viewport. Purely visual; renders a div.
 */
export function Reveal({ children, delay = 0, y = 28, className, once = true, ...rest }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-70px" }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
