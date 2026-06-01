import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bubbleSort, mergeSort, quickSort, heapSort, SORT_INFO } from '../algorithms/sorting';
import { PlaybackBar } from '../components/PlaybackBar';
import { usePlayback } from '../hooks/usePlayback';
import type { SortStep, SortAlgorithm } from '../types';

const ALGORITHMS: { key: SortAlgorithm; label: string }[] = [
  { key: 'bubble', label: 'Bubble Sort' },
  { key: 'merge',  label: 'Merge Sort'  },
  { key: 'quick',  label: 'Quick Sort'  },
  { key: 'heap',   label: 'Heap Sort'   },
];

const SORT_FN: Record<SortAlgorithm, (arr: number[]) => SortStep[]> = {
  bubble: bubbleSort, merge: mergeSort, quick: quickSort, heap: heapSort,
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
}

function getBarClass(index: number, step: SortStep | null, isComplete: boolean): string {
  if (isComplete) return 'bar-sorted';
  if (!step)      return 'bar-default';
  const { type, indices } = step;
  if (type === 'done')                    return 'bar-sorted';
  if (!indices.includes(index))           return 'bar-default';
  if (type === 'swap')                    return 'bar-swap';
  if (type === 'compare')                 return 'bar-compare';
  if (type === 'pivot' || type === 'partition') return 'bar-pivot';
  if (type === 'merge' || type === 'set') return 'bar-sorted';
  return 'bar-default';
}

/* ── Reusable stat row ── */
function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid rgba(180,130,80,0.10)',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7A50' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: accent ?? '#1C0A00', fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

/* ── Section heading inside a card ── */
function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, color: '#C4A078',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      margin: '0 0 16px',
    }}>
      {children}
    </p>
  );
}

export function SortingArena() {
  const [size,       setSize]       = useState(30);
  const [algorithm,  setAlgorithm]  = useState<SortAlgorithm>('bubble');
  const [array,      setArray]      = useState<number[]>(() => generateArray(30));
  const [displayArr, setDisplayArr] = useState<number[]>(() => generateArray(30));
  const [curStep,    setCurStep]    = useState<SortStep | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [stats,      setStats]      = useState({ comparisons: 0, swaps: 0 });

  const steps = useMemo(() => SORT_FN[algorithm](array), [array, algorithm]);

  const cumulativeStats = useMemo(() => {
    let comparisons = 0, swaps = 0;
    return steps.map((s) => {
      if (s.type === 'compare') comparisons++;
      if (s.type === 'swap')    swaps++;
      return { comparisons, swaps };
    });
  }, [steps]);

  const handleStep = useCallback((step: SortStep, index: number) => {
    setDisplayArr(step.array);
    setCurStep(step);
    setStats(cumulativeStats[index] ?? { comparisons: 0, swaps: 0 });
  }, [cumulativeStats]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  const handleReset = useCallback(() => {
    setDisplayArr(array);
    setCurStep(null);
    setIsComplete(false);
    setStats({ comparisons: 0, swaps: 0 });
  }, [array]);

  const playback = usePlayback<SortStep>({ steps, onStep: handleStep, onComplete: handleComplete, onReset: handleReset });

  const handleGenerate = () => {
    const a = generateArray(size);
    setArray(a); setDisplayArr(a); setCurStep(null);
    setIsComplete(false); setStats({ comparisons: 0, swaps: 0 });
    playback.reset();
  };

  const handleAlgorithmChange = (alg: SortAlgorithm) => {
    setAlgorithm(alg); playback.reset(); setCurStep(null);
    setIsComplete(false); setStats({ comparisons: 0, swaps: 0 });
    setDisplayArr(array);
  };

  const maxVal = Math.max(...displayArr, 1);
  const info   = SORT_INFO[algorithm];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-factory-bg)', paddingTop: 80, paddingBottom: 56 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/">
            <motion.button
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, background: '#F5ECE0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9B7A50', boxShadow: '0 4px 0 rgba(0,0,0,0.10)' }}
              whileTap={{ y: 3 }}>
              <ChevronLeft size={14} /> Home
            </motion.button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.span style={{ fontSize: 44 }}
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
              🏭
            </motion.span>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1C0A00', margin: 0, lineHeight: 1.1 }}>Sorting Factory</h1>
              <p style={{ fontSize: 14, color: '#9B7A50', margin: '4px 0 0' }}>Watch algorithms sort blocks on the assembly line</p>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, fontSize: 22 }}>
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>⚙️</motion.span>
            <motion.span animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>🔧</motion.span>
          </div>
        </motion.div>

        {/* ── Controls bar ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            background: '#FFFFFF', borderRadius: 18,
            boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 12px 28px rgba(0,0,0,0.05)',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20,
          }}>
          {/* Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#9B7A50', whiteSpace: 'nowrap' }}>Elements</span>
            <input type="range" min={8} max={80} value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="clay-range" style={{ width: 120 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1C0A00', minWidth: 28, textAlign: 'right' }}>{size}</span>
          </div>

          <div style={{ width: 1, height: 28, background: '#F0E0C8' }} />

          {/* Algorithm tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALGORITHMS.map(({ key, label }) => (
              <motion.button key={key} onClick={() => handleAlgorithmChange(key)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700,
                  background: algorithm === key ? '#FF6B35' : '#F5ECE0',
                  color:      algorithm === key ? '#fff'    : '#9B7A50',
                  boxShadow:  algorithm === key ? '0 4px 0 #A83400' : '0 4px 0 rgba(0,0,0,0.09)',
                }}
                whileTap={{ y: algorithm === key ? 3 : 2 }}>
                {label}
              </motion.button>
            ))}
          </div>

          <motion.button onClick={handleGenerate}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: '#FFD166', color: '#3D2B00',
              boxShadow: '0 4px 0 #A07A00',
            }}
            whileTap={{ y: 3 }}>
            <Shuffle size={14} /> New Array
          </motion.button>
        </motion.div>

        {/* ── Main layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

          {/* ── Visualization ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Bar chart */}
            <div style={{
              background: '#FFFFFF', borderRadius: 20,
              boxShadow: '0 8px 0 rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.05)',
              padding: '24px 24px 16px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#1C0A00' }}>{info.name}</span>
                <span style={{ padding: '3px 10px', borderRadius: 100, background: '#FFF4EC', color: '#FF6B35', fontSize: 12, fontWeight: 700 }}>{info.time}</span>
                <span style={{ padding: '3px 10px', borderRadius: 100, background: '#EFF8FF', color: '#0EA5E9', fontSize: 12, fontWeight: 700 }}>{info.space}</span>
              </div>

              {/* Bars */}
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 2,
                height: 340, background: 'linear-gradient(to top,#FFE8CC,#FFF8EE)',
                borderRadius: 14, padding: '0 6px 6px',
              }}>
                {displayArr.map((val, i) => {
                  const barClass = getBarClass(i, curStep, isComplete);
                  const isActive = curStep?.indices.includes(i);
                  const isSwap   = isActive && curStep?.type === 'swap';
                  const isCmp    = isActive && curStep?.type === 'compare';
                  return (
                    <motion.div key={i} className={`rounded-t-lg ${barClass}`}
                      style={{ height: `${(val / maxVal) * 100}%`, flex: '1 1 0', minWidth: 2, transformOrigin: 'bottom' }}
                      animate={isSwap ? { y: [-18, 0], scaleY: [1.18, 1] } : isCmp ? { scaleY: [1.1, 1] } : {}}
                      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(180,130,80,0.12)' }}>
                {[['bar-default','Default'],['bar-compare','Comparing'],['bar-swap','Swapping'],['bar-pivot','Pivot'],['bar-sorted','Sorted']].map(
                  ([cls, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className={cls} style={{ width: 14, height: 14, borderRadius: 3 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#9B7A50' }}>{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Playback — brain integrated inside */}
            <PlaybackBar
              state={playback.state} speed={playback.speed}
              currentStep={playback.currentStep} totalSteps={playback.totalSteps}
              onPlay={playback.play} onPause={playback.pause}
              onStep={playback.step} onStepBack={playback.stepBack}
              onReset={playback.reset} onSpeedChange={playback.setSpeed}
              accentColor="#FF6B35" accentDeep="#A83400"
              brainDescription={isComplete
                ? `Done! ${info.name} used ${stats.comparisons} comparisons and ${stats.swaps} swaps.`
                : curStep?.description ?? ''}
              brainStepType={isComplete ? 'done' : curStep?.type}
            />
          </motion.div>

          {/* ── Side Panel ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Live Stats */}
            <div style={{
              background: '#FFFFFF', borderRadius: 20,
              boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 12px 28px rgba(0,0,0,0.05)',
              padding: '24px 24px 8px',
            }}>
              <CardHeading>📊 Live Stats</CardHeading>
              <StatRow label="Comparisons" value={stats.comparisons}    accent="#D97706" />
              <StatRow label="Swaps"        value={stats.swaps}          accent="#DC2626" />
              <StatRow label="Array Size"   value={displayArr.length} />
              <StatRow label="Total Steps"  value={steps.length} />
              <div style={{ height: 16 }} />
            </div>

            {/* Algorithm Info */}
            <div style={{
              background: '#FFFFFF', borderRadius: 20,
              boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 12px 28px rgba(0,0,0,0.05)',
              padding: 24,
            }}>
              <CardHeading>📖 Algorithm</CardHeading>
              <p style={{ fontSize: 13, color: '#9B7A50', lineHeight: 1.7, margin: '0 0 20px' }}>{info.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF4EC', borderRadius: 12, padding: '10px 16px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7A50' }}>⏱️ Time</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FF6B35' }}>{info.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF8FF', borderRadius: 12, padding: '10px 16px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7A50' }}>💾 Space</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0EA5E9' }}>{info.space}</span>
                </div>
              </div>
            </div>

            {/* All Algorithms */}
            <div style={{
              background: '#FFFFFF', borderRadius: 20,
              boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 12px 28px rgba(0,0,0,0.05)',
              padding: 24,
            }}>
              <CardHeading>🏭 All Algorithms</CardHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ALGORITHMS.map(({ key, label }) => (
                  <motion.button key={key}
                    onClick={() => handleAlgorithmChange(key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: algorithm === key ? '#FFF4EC' : '#F9F5F0',
                      color: algorithm === key ? '#FF6B35' : '#9B7A50',
                      fontSize: 13, fontWeight: algorithm === key ? 800 : 600,
                      boxShadow: algorithm === key ? 'inset 0 0 0 1.5px rgba(255,107,53,0.3)' : 'none',
                    }}
                    whileTap={{ scale: 0.98 }}>
                    {label}
                    {algorithm === key && <span style={{ fontSize: 12 }}>▶</span>}
                  </motion.button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
