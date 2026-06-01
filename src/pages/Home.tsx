import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface WorldDef {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  cardClass: string;
  btnBg: string;
  btnShadow: string;
  algorithms: string[];
  decor: string[];
  accent: string;
}

const WORLDS: WorldDef[] = [
  {
    id: 'sorting', path: '/sorting',
    title: 'Sorting Factory', subtitle: 'Industrial assembly line',
    description: 'Watch algorithms sort blocks on a mechanical conveyor belt — compare, swap, and conquer in real-time.',
    emoji: '🏭', cardClass: 'world-card-factory',
    btnBg: '#FF6B35', btnShadow: '#A83400',
    algorithms: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort'],
    decor: ['⚙️', '🔧', '📦', '🏗️'], accent: '#FF6B35',
  },
  {
    id: 'pathfinding', path: '/pathfinding',
    title: 'Pathfinding City', subtitle: 'Miniature city simulation',
    description: 'Build city maps, place roads and obstacles, then watch algorithms race to the destination.',
    emoji: '🏙️', cardClass: 'world-card-city',
    btnBg: '#0EA5E9', btnShadow: '#0369A1',
    algorithms: ['BFS', 'DFS', 'Dijkstra', 'A*', 'Bellman-Ford'],
    decor: ['🏠', '🚗', '🛣️', '🗺️'], accent: '#0EA5E9',
  },
  {
    id: 'tree', path: '/tree',
    title: 'Tree Forest', subtitle: 'Living digital forest',
    description: 'Grow binary trees, watch nodes rotate and balance like living organisms in a vibrant forest.',
    emoji: '🌲', cardClass: 'world-card-forest',
    btnBg: '#22C55E', btnShadow: '#15803D',
    algorithms: ['BST', 'AVL Tree', 'Preorder', 'Inorder', 'Postorder'],
    decor: ['🌿', '🍃', '🌳', '🦋'], accent: '#22C55E',
  },
  {
    id: 'graph', path: '/graph',
    title: 'Graph Galaxy', subtitle: 'Cosmic network explorer',
    description: 'Connect planets through space routes and discover minimal spanning galaxies across the cosmos.',
    emoji: '🌌', cardClass: 'world-card-galaxy',
    btnBg: '#8B5CF6', btnShadow: '#6D28D9',
    algorithms: ["Dijkstra", "Prim's", "Kruskal's", 'Topo Sort', 'Cycle Detect'],
    decor: ['⭐', '🪐', '🌟', '🚀'], accent: '#8B5CF6',
  },
];

export function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 80, paddingBottom: 64 }}>

      {/* ── Ambient blobs ── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '8%',    left: '4%',  width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,107,53,0.07)',  filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', top: '45%',   right: '4%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(14,165,233,0.07)',   filter: 'blur(90px)'  }} />
        <div style={{ position: 'absolute', bottom: '10%',left: '30%', width: 440, height: 440, borderRadius: '50%', background: 'rgba(139,92,246,0.06)',   filter: 'blur(110px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ HERO ══ */}
        <section style={{ textAlign: 'center', padding: '48px 32px 56px' }}>
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
              <motion.span style={{ fontSize: 56, lineHeight: 1 }}
                animate={{ rotate: [0, -12, 12, -6, 6, 0] }}
                transition={{ duration: 1.6, delay: 0.8 }}>
                🎮
              </motion.span>
              <h1 style={{
                fontSize: 'clamp(44px, 6vw, 80px)', fontWeight: 900,
                letterSpacing: '-2px', lineHeight: 1, margin: 0,
                background: 'linear-gradient(135deg, #FF6B35 0%, #FFD166 45%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Opti<span style={{ WebkitTextFillColor: '#FF6B35', color: '#FF6B35' }}>ka</span>
              </h1>
            </div>

            <p style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 800, color: '#3D2B00', margin: '0 auto 12px', maxWidth: 560 }}>
              Don't memorize algorithms —{' '}
              <span style={{ color: '#FF6B35' }}>experience them.</span>
            </p>
            <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', color: '#9B7A50', margin: '0 auto 36px', maxWidth: 480, lineHeight: 1.65 }}>
              4 interactive worlds. Step-by-step animations.<br />
              An Algorithm Brain that explains every decision.
            </p>

            {/* Feature chips — relevant only */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 580, margin: '0 auto' }}>
              {[
                ['▶️', 'Step-by-step playback'],
                ['🧠', 'Algorithm Brain panel'],
                ['⏪', 'Rewind any time'],
                ['⚡', 'Speed control'],
              ].map(([icon, text]) => (
                <span key={text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 100,
                  background: '#FFFFFF',
                  boxShadow: '0 3px 0 rgba(0,0,0,0.07), 0 6px 16px rgba(0,0,0,0.05)',
                  color: '#9B7A50', fontSize: 13, fontWeight: 700,
                }}>
                  {icon} {text}
                </span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══ WORLD GRID ══ */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: 36 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 900, color: '#1C0A00', margin: '0 0 8px' }}>
              Choose Your World
            </h2>
            <p style={{ color: '#9B7A50', fontSize: 14, margin: 0 }}>
              Each world is a fully playable algorithm simulation
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 28,
          }}>
            {WORLDS.map((w, i) => <WorldCard key={w.id} world={w} delay={i * 0.08} />)}
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer style={{ textAlign: 'center', marginTop: 72, color: '#C4A078', fontSize: 12, padding: '0 32px' }}>
          Optika — Experience algorithms, don't just study them.
        </footer>
      </div>
    </div>
  );
}

function WorldCard({ world, delay }: { world: WorldDef; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay }}
    >
      <Link to={world.path} style={{ display: 'block', textDecoration: 'none' }}>
        <motion.div
          className={world.cardClass}
          style={{ borderRadius: 22, overflow: 'hidden', cursor: 'pointer' }}
          whileHover={{ y: -8, scale: 1.012 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          {/* Illustration strip */}
          <div style={{
            height: 136, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${world.accent}18, ${world.accent}08)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {world.decor.map((emoji, i) => (
              <motion.span key={i} style={{
                position: 'absolute', fontSize: 24, userSelect: 'none',
                top: `${14 + (i % 2) * 42}%`, left: `${8 + i * 22}%`,
              }}
                animate={{ y: [0, -7, 0], rotate: [0, i % 2 === 0 ? 7 : -7, 0] }}
                transition={{ duration: 3.2 + i * 0.3, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}>
                {emoji}
              </motion.span>
            ))}
            <motion.span style={{ fontSize: 62, userSelect: 'none', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              {world.emoji}
            </motion.span>
          </div>

          {/* Content */}
          <div style={{ padding: '24px 28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1C0A00', margin: '0 0 4px', lineHeight: 1.2 }}>
                  {world.title}
                </h3>
                <p style={{ fontSize: 12, fontWeight: 700, color: world.accent, margin: 0 }}>
                  {world.subtitle}
                </p>
              </div>
              <motion.div style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 11, fontSize: 12, fontWeight: 800,
                background: world.btnBg, color: '#fff',
                boxShadow: `0 4px 0 ${world.btnShadow}`, whiteSpace: 'nowrap',
              }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ y: 3, boxShadow: `0 1px 0 ${world.btnShadow}` }}>
                Enter <ArrowRight size={12} />
              </motion.div>
            </div>

            <p style={{ fontSize: 14, color: '#9B7A50', lineHeight: 1.65, margin: '0 0 18px' }}>
              {world.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {world.algorithms.map((algo) => (
                <span key={algo} style={{
                  padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: `${world.accent}18`, color: world.accent,
                }}>
                  {algo}
                </span>
              ))}
            </div>
          </div>

          <div style={{ height: 5, background: `linear-gradient(90deg, ${world.btnBg}, ${world.btnBg}70)` }} />
        </motion.div>
      </Link>
    </motion.div>
  );
}
