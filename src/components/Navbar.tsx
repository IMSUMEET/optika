import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',             label: 'Home' },
  { path: '/sorting',     label: 'Sorting' },
  { path: '/pathfinding', label: 'Pathfinding' },
  { path: '/tree',        label: 'Trees' },
  { path: '/graph',       label: 'Graphs' },
];

export function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 40,
          height: 60,
          background: 'rgba(255,248,238,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '2px solid rgba(180,130,80,0.13)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
          }}
        >
          {/* ── Logo ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <motion.div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#FF6B35,#FFD166)',
                boxShadow: '0 4px 0 #A83400',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}
              whileTap={{ y: 3, boxShadow: '0 1px 0 #A83400' }}
            >
              🎮
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#1C0A00', letterSpacing: '-0.5px', lineHeight: 1 }}>
              Opti<span style={{ color: '#FF6B35' }}>ka</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}
            className="hide-mobile"
          >
            {NAV_ITEMS.map(({ path, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  style={{ textDecoration: 'none', position: 'relative' }}
                >
                  <motion.span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 14px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#FF6B35' : '#9B7A50',
                      background: isActive ? 'rgba(255,107,53,0.10)' : 'transparent',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                    whileHover={{ background: 'rgba(255,107,53,0.07)', color: '#FF6B35' } as any}
                    whileTap={{ scale: 0.96 }}
                  >
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        style={{
                          position: 'absolute',
                          bottom: -2, left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20, height: 3,
                          borderRadius: 2,
                          background: '#FF6B35',
                        }}
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                      />
                    )}
                  </motion.span>
                </Link>
              );
            })}
          </div>

          {/* ── Mobile hamburger ── */}
          <motion.button
            onClick={() => setOpen((v) => !v)}
            style={{
              marginLeft: 'auto',
              display: 'none',
              padding: 8, borderRadius: 10,
              background: '#F5ECE0',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 0 rgba(0,0,0,0.10)',
            }}
            className="show-mobile"
            whileTap={{ y: 2 }}
          >
            {open ? <X size={18} color="#9B7A50" /> : <Menu size={18} color="#9B7A50" />}
          </motion.button>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'fixed', top: 60, left: 16, right: 16, zIndex: 39,
            background: '#FFFFFF', borderRadius: 16,
            boxShadow: '0 10px 0 rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.12)',
            padding: '8px 0',
          }}
        >
          {NAV_ITEMS.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: 14,
                color: location.pathname === path ? '#FF6B35' : '#9B7A50',
                textDecoration: 'none',
                background: location.pathname === path ? 'rgba(255,107,53,0.07)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </motion.div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
