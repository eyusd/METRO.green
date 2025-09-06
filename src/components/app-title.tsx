"use client"

import { motion } from "framer-motion"

export function AppTitle() {
  return (
    <motion.div 
      className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.3 
      }}
    >
      <motion.h1 
        className="text-3xl font-bold tracking-tight drop-shadow-2xl text-black"
        style={{ 
          fontFamily: "'Cal Sans', 'Inter', sans-serif",
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          delay: 0.5 
        }}
      >
        METRO.<span className="text-emerald-400">green</span>
      </motion.h1>
    </motion.div>
  )
}
