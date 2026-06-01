import { motion, AnimatePresence } from 'framer-motion';

interface AlgorithmBrainProps {
  description: string;
  stepType?: string;
  accentColor?: string;
}

const TYPE_ICONS: Record<string, string> = {
  compare: '🔍', swap: '🔄', pivot: '📌', partition: '✂️',
  merge: '🔗', set: '📥', done: '✅', visit: '👣',
  explore: '🗺️', path: '🛤️', 'wall-hit': '🧱',
  insert: '➕', delete: '🗑️', found: '✅', 'not-found': '❌',
  rotate: '🔁', balance: '⚖️', 'add-to-mst': '🌿',
  'explore-edge': '➡️', relax: '📉', reject: '❌', cycle: '🔴', sort: '🗂️',
};

const TYPE_COLORS: Record<string, string> = {
  compare: '#D97706', swap: '#DC2626', pivot: '#C2410C',
  merge: '#059669', set: '#059669', done: '#059669',
  visit: '#2563EB', explore: '#7C3AED', path: '#D97706',
  insert: '#059669', delete: '#DC2626', found: '#059669', 'not-found': '#DC2626',
  rotate: '#7C3AED', balance: '#7C3AED', 'add-to-mst': '#059669',
  'explore-edge': '#2563EB', relax: '#D97706', reject: '#DC2626', cycle: '#DC2626',
};

export function AlgorithmBrain({ description, stepType, accentColor = '#FF6B35' }: AlgorithmBrainProps) {
  const icon  = stepType ? (TYPE_ICONS[stepType]  ?? '💭') : '💭';
  const color = stepType ? (TYPE_COLORS[stepType] ?? accentColor) : '#C4A078';
  const isEmpty = !description || !stepType;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={description?.slice(0, 40)}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 18px', borderRadius: 14,
          background: isEmpty ? 'rgba(0,0,0,0.03)' : `${color}12`,
          border: `1.5px solid ${isEmpty ? 'transparent' : `${color}30`}`,
          minHeight: 52,
        }}
      >
        <motion.span
          key={stepType}
          style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}
          animate={stepType && !isEmpty ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.35 }}
        >
          {icon}
        </motion.span>
        <p style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.55,
          color: isEmpty ? '#C4A078' : '#1C0A00',
          margin: 0,
        }}>
          {description || 'Press Play — the algorithm will narrate every decision here.'}
        </p>
        {stepType && !isEmpty && (
          <span style={{
            flexShrink: 0, fontSize: 11, fontWeight: 800,
            padding: '2px 8px', borderRadius: 100,
            background: `${color}20`, color,
            marginTop: 2,
          }}>
            {stepType}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
