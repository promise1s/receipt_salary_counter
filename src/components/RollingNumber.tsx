import { motion } from 'motion/react';
import React from 'react';

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface DigitProps {
  value: number;
  height: number;
}

const Digit: React.FC<DigitProps> = ({ value, height }) => {
  return (
    <div style={{ height }} className="relative w-[0.6em] overflow-hidden inline-block">
      <motion.div
        initial={false}
        animate={{ y: -1 * value * height }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="absolute top-0 left-0 flex flex-col"
      >
        {NUMBERS.map((num) => (
          <div key={num} style={{ height }} className="flex items-center justify-center">
            {num}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function RollingNumber({ value, fontSize = 36, className = "" }: { value: number, fontSize?: number, className?: string }) {
  // Format with commas: 1,234.56
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  // We need to maintain stable keys for digits to prevent re-mounting
  // We can reverse the string to key from the decimal/end
  const chars = formatted.split('');

  const height = fontSize * 1.2;

  return (
    <div className={`flex items-center justify-center font-mono ${className}`} style={{ fontSize, height }}>
      <div style={{ height }} className="flex items-center justify-center mr-1">
        <span className="font-sans relative top-[0.05em]">¥</span>
      </div>
      {chars.map((char, index) => {
        if (!/[0-9]/.test(char)) {
          return (
            <div key={`char-${index}`} style={{ height }} className="flex items-center justify-center">
              <span className="font-sans">{char}</span>
            </div>
          );
        }
        return <Digit key={`digit-${chars.length - index}`} value={parseInt(char)} height={height} />;
      })}
    </div>
  );
}
