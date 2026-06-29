import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  distance: number;
  size: number;
  rotation: number;
  delay: number;
}

interface ParticleBurstProps {
  originX: number;
  originY: number;
  onComplete: () => void;
  particleCount?: number;
  duration?: number;
}

export default function ParticleBurst({
  originX,
  originY,
  onComplete,
  particleCount = 16,
  duration = 1,
}: ParticleBurstProps) {
  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    startX: originX + (Math.random() * 40 - 20),
    startY: originY + (Math.random() * 40 - 20),
    angle: Math.random() * 360,
    distance: 80 + Math.random() * 200,
    size: 12 + Math.random() * 18,
    rotation: Math.random() * 720 - 360,
    delay: Math.random() * 100,
  }));

  useEffect(() => {
    const timer = setTimeout(onComplete, duration * 1000);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.span
            key={p.id}
            className="absolute"
            style={{ fontSize: p.size, left: p.startX, top: p.startY }}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
            animate={{
              x: tx,
              y: ty,
              scale: [0.2, 1.1, 0.7],
              opacity: [1, 1, 0],
              rotate: p.rotation,
            }}
            transition={{ duration, delay: p.delay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
          >
            🧿
          </motion.span>
        );
      })}
    </div>
  );
}
