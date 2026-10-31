"use client";
import React from 'react';
import { motion } from 'motion/react';

export function ChatMessage({ message, isAi }: { message: string, isAi: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`p-4 rounded-lg max-w-[80%] ${isAi ? 'bg-surface border border-border shadow-sm text-foreground' : 'bg-primary text-primary-foreground'}`}>
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}
