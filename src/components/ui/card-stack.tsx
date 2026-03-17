"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface CardStackItem {
  id: string;
  content: React.ReactNode;
}

interface CardStackProps {
  items: CardStackItem[];
  offset?: number;
  scaleFactor?: number;
}

export function CardStack({
  items,
  offset = 12,
  scaleFactor = 0.04,
}: CardStackProps) {
  const [stack, setStack] = useState(items);

  const sendToBack = () => {
    setStack((prev) => {
      const newStack = [...prev];
      const first = newStack.shift();
      if (first) newStack.push(first);
      return newStack;
    });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AnimatePresence mode="popLayout">
        {stack.map((item, index) => {
          const isTop = index === 0;
          return (
            <motion.div
              key={item.id}
              layout
              onClick={isTop ? sendToBack : undefined}
              style={{
                position: "absolute",
                width: 340,
                cursor: isTop ? "pointer" : "default",
                zIndex: stack.length - index,
                transformOrigin: "center center",
              }}
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{
                scale: 1 - index * scaleFactor,
                y: -index * offset,
                opacity: index < 4 ? 1 : 0,
              }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {item.content}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
