import React from "react";
import { motion } from "framer-motion";

const Headtext = ({ text, className }) => {
  return (
    <h2
      className={`font-display text-3xl md:text-4xl font-medium tracking-wide capitalize ${className}`}
      style={{ color: "#1a1a14" }}
    >
      <span className="relative inline-block pb-1">
        {text?.toLowerCase()}
        <motion.span
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #B08D57, transparent)", width: 0 }}
          animate={{ width: "70%" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </span>
    </h2>
  );
};

export default Headtext;
