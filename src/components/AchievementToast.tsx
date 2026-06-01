import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export function AchievementToast() {
  const toastQueue   = useStore((s) => s.toastQueue);
  const dismissToast = useStore((s) => s.dismissToast);

  const current = toastQueue[0];

  useEffect(() => {
    if (current) {
      const t = setTimeout(() => dismissToast(current.id), 4200);
      return () => clearTimeout(t);
    }
  }, [current, dismissToast]);

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 120, scale: 0.7, rotate: 6 }}
            animate={{ opacity: 1, x: 0,   scale: 1,   rotate: 0 }}
            exit={{    opacity: 0, x: 120,  scale: 0.7, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="pointer-events-auto"
          >
            <div
              className="rounded-2xl p-4 flex items-center gap-3 min-w-[300px] max-w-xs"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 8px 0 rgba(255,209,102,0.5), 0 16px 32px rgba(0,0,0,0.12)',
                border: '2px solid rgba(255,209,102,0.6)',
              }}
            >
              {/* Icon */}
              <motion.div
                className="w-13 h-13 shrink-0 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: '#FFF8EE', boxShadow: '0 4px 0 rgba(255,209,102,0.5)' }}
                animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {current.achievement.icon}
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#B89000' }}>
                    🏆 Achievement!
                  </span>
                </div>
                <div className="font-extrabold text-[#1C0A00] text-sm truncate">
                  {current.achievement.title}
                </div>
                <div className="text-[#9B7A50] text-xs leading-tight mt-0.5 line-clamp-2">
                  {current.achievement.description}
                </div>
              </div>

              {/* Confetti dots */}
              {['🌟','✨','🎉'].map((e, i) => (
                <motion.span
                  key={i}
                  className="absolute text-sm pointer-events-none select-none"
                  style={{ top: -8 + i * 4, right: 8 + i * 12 }}
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -24, scale: [0, 1.2, 0] }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.12 }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
