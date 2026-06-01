import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { AlgorithmBrain } from './AlgorithmBrain';

interface PlaybackBarProps {
  state: string;
  speed: number;
  currentStep: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  accentColor?: string;
  accentDeep?: string;
  brainDescription?: string;
  brainStepType?: string;
}

const SPEEDS = [0.5, 1, 2, 4, 8, 10];

export function PlaybackBar({
  state,
  speed,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  accentColor = '#FF6B35',
  accentDeep  = '#A83400',
  brainDescription,
  brainStepType,
}: PlaybackBarProps) {
  const isPlaying = state === 'playing';
  const isDone    = state === 'complete';
  const isIdle    = state === 'idle' || currentStep < 0;
  const progress  = totalSteps > 0 ? Math.max(0, ((currentStep + 1) / totalSteps) * 100) : 0;

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 20,
      boxShadow: '0 8px 0 rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.05)',
      padding: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>

      {/* ── Brain narration (inline) ── */}
      {brainDescription !== undefined && (
        <AlgorithmBrain
          description={brainDescription}
          stepType={brainStepType}
          accentColor={accentColor}
        />
      )}

      {/* ── Progress bar ── */}
      <div>
        <div style={{
          background: '#F0EAE0', borderRadius: 100, height: 8,
          overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.07)',
        }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 100,
              background: isDone
                ? 'linear-gradient(90deg,#34D399,#06D6A0)'
                : `linear-gradient(90deg,${accentColor},#FFD166)`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 6,
          fontSize: 11, fontWeight: 600, color: '#C4A078',
        }}>
          <span>{totalSteps > 0 ? `${Math.round(progress)}%` : '—'}</span>
          <span>{totalSteps > 0 ? `${totalSteps} steps` : 'Press Play'}</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
      }}>

        {/* Reset */}
        <motion.button
          onClick={onReset}
          disabled={isIdle}
          title="Reset"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#F5ECE0', color: '#9B7A50',
            fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 0 rgba(0,0,0,0.09)',
            opacity: isIdle ? 0.38 : 1,
          }}
          whileTap={!isIdle ? { y: 3, boxShadow: '0 1px 0 rgba(0,0,0,0.09)' } as any : {}}
        >
          <RotateCcw size={14} /> Reset
        </motion.button>

        {/* Play / Pause — the single hero button */}
        <motion.button
          onClick={isPlaying ? onPause : onPlay}
          style={{
            width: 60, height: 60, borderRadius: 18, border: 'none', cursor: 'pointer',
            background: isDone ? '#34D399' : accentColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDone ? '0 5px 0 #059669' : `0 5px 0 ${accentDeep}`,
            flexShrink: 0,
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ y: 5, boxShadow: isDone ? '0 1px 0 #059669' : `0 1px 0 ${accentDeep}` } as any}
          animate={
            isIdle && !isDone
              ? {
                  boxShadow: [
                    `0 5px 0 ${accentDeep}`,
                    `0 5px 0 ${accentDeep}, 0 0 0 8px ${accentColor}28`,
                    `0 5px 0 ${accentDeep}`,
                  ],
                }
              : {}
          }
          transition={isIdle && !isDone ? { duration: 2, repeat: Infinity } : {}}
        >
          {isDone
            ? <span style={{ fontSize: 24 }}>✓</span>
            : isPlaying
            ? <Pause size={24} />
            : <Play size={24} style={{ transform: 'translateX(2px)' }} />}
        </motion.button>

        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#C4A078' }}>Speed</span>
          <div style={{
            display: 'flex', background: '#F5ECE0', borderRadius: 10, padding: 3, gap: 1,
          }}>
            {SPEEDS.map((s) => (
              <motion.button key={s} onClick={() => onSpeedChange(s)}
                style={{
                  padding: '5px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, minWidth: 30,
                  background: speed === s ? accentColor : 'transparent',
                  color:      speed === s ? '#fff' : '#C4A078',
                  boxShadow:  speed === s ? `0 2px 0 ${accentDeep}` : 'none',
                }}
                whileTap={{ y: 1 } as any}>
                {s}x
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Done banner */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: -8 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              textAlign: 'center', padding: '10px 16px', borderRadius: 12,
              background: 'rgba(6,214,160,0.10)', border: '1.5px solid rgba(6,214,160,0.28)',
              fontSize: 13, fontWeight: 700, color: '#059669',
            }}
          >
            ✅ Visualization complete!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
