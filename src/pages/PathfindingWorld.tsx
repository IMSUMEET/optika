import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Shuffle, Eraser, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bfs, dfs, dijkstra, astar, bellmanFord, PATH_INFO } from '../algorithms/pathfinding';
import { PlaybackBar } from '../components/PlaybackBar';
import { usePlayback } from '../hooks/usePlayback';
import type { GridCell, PathStep, PathAlgorithm, CellType } from '../types';

const ROWS = 20;
const COLS = 40;
const DEFAULT_START: [number, number] = [10, 5];
const DEFAULT_END:   [number, number] = [10, 34];

const ALGORITHMS: { key: PathAlgorithm; label: string; emoji: string; color: string; shadow: string }[] = [
  { key: 'bfs',          label: 'BFS',          emoji: '🌊', color: '#0EA5E9', shadow: '#0369A1' },
  { key: 'dfs',          label: 'DFS',          emoji: '🌀', color: '#8B5CF6', shadow: '#6D28D9' },
  { key: 'dijkstra',     label: 'Dijkstra',     emoji: '📏', color: '#F59E0B', shadow: '#B45309' },
  { key: 'astar',        label: 'A*',           emoji: '⭐', color: '#22C55E', shadow: '#15803D' },
  { key: 'bellman-ford', label: 'Bellman-Ford', emoji: '🔋', color: '#F43F5E', shadow: '#BE123C' },
];

const TOOLS: { key: CellType; label: string; emoji: string }[] = [
  { key: 'wall',   label: 'Wall',   emoji: '🧱' },
  { key: 'start',  label: 'Start',  emoji: '🟢' },
  { key: 'end',    label: 'End',    emoji: '🔴' },
  { key: 'weight', label: 'Weight', emoji: '⚖️' },
];

const ALGO_FNS: Record<PathAlgorithm, (g: GridCell[][], s: [number, number], e: [number, number]) => PathStep[]> = {
  bfs, dfs, dijkstra, astar, 'bellman-ford': bellmanFord,
};

function createEmptyGrid(start: [number, number], end: [number, number]): GridCell[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r, col: c,
      type: (r === start[0] && c === start[1] ? 'start' : r === end[0] && c === end[1] ? 'end' : 'empty') as CellType,
      weight: 1, visited: false, inPath: false, distance: Infinity, parent: null,
    }))
  );
}

function getCellStyle(cell: GridCell): React.CSSProperties {
  if (cell.inPath)            return { background: '#F59E0B', boxShadow: 'inset 0 -2px 0 #B45309' };  /* vivid amber */
  if (cell.type === 'start')  return { background: '#10B981', boxShadow: 'inset 0 -2px 0 #047857' };  /* emerald */
  if (cell.type === 'end')    return { background: '#EF4444', boxShadow: 'inset 0 -2px 0 #B91C1C' };  /* red */
  if (cell.type === 'wall')   return { background: '#374151', boxShadow: 'inset 0 2px 0 #1F2937' };
  if (cell.type === 'weight') return { background: '#FDE68A' };
  if (cell.visited)           return { background: '#93C5FD' };  /* visible but not overwhelming */
  return { background: '#F8FAFC' };
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
      {children}
    </p>
  );
}

export function PathfindingWorld() {
  const [algorithm, setAlgorithm] = useState<PathAlgorithm>('bfs');
  const [tool,      setTool]      = useState<CellType>('wall');
  const [startPos,  setStartPos]  = useState<[number, number]>(DEFAULT_START);
  const [endPos,    setEndPos]    = useState<[number, number]>(DEFAULT_END);
  const [grid,      setGrid]      = useState<GridCell[][]>(() => createEmptyGrid(DEFAULT_START, DEFAULT_END));
  const [steps,     setSteps]     = useState<PathStep[]>([]);
  const [stepDesc,  setStepDesc]  = useState('Draw walls on the grid, then press ▶ Play to start.');
  const [stepType,  setStepType]  = useState<string | undefined>(undefined);
  const [nodesVisited, setNodesVisited] = useState(0);
  const [pathLength,   setPathLength]   = useState(0);
  const [hasRun,       setHasRun]       = useState(false);

  const isDrawing   = useRef(false);
  const visitedRef  = useRef<Set<string>>(new Set());
  const pathRef     = useRef<Set<string>>(new Set());
  const gridRef     = useRef(grid);
  gridRef.current = grid;

  const clearVisualization = useCallback(() => {
    visitedRef.current.clear(); pathRef.current.clear();
    setNodesVisited(0); setPathLength(0);
    setStepDesc('Draw walls on the grid, then press ▶ Play to start.');
    setStepType(undefined); setHasRun(false);
    setGrid((prev) => prev.map((row) => row.map((cell) => ({
      ...cell, visited: false, inPath: false, distance: Infinity,
      parent: null, f: undefined, g: undefined, h: undefined,
    }))));
  }, []);

  const handleStep = useCallback((s: PathStep) => {
    setStepDesc(s.description); setStepType(s.type);
    const key = `${s.row},${s.col}`;
    if (s.type === 'visit') {
      visitedRef.current.add(key); setNodesVisited(visitedRef.current.size);
      setGrid((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        if (next[s.row][s.col].type !== 'start' && next[s.row][s.col].type !== 'end')
          next[s.row][s.col].visited = true;
        return next;
      });
    } else if (s.type === 'explore') {
      setGrid((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        if (next[s.row][s.col].type !== 'start' && next[s.row][s.col].type !== 'end' && !visitedRef.current.has(key))
          next[s.row][s.col].visited = true;
        return next;
      });
    } else if (s.type === 'path') {
      pathRef.current.add(key); setPathLength(pathRef.current.size);
      setGrid((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        next[s.row][s.col].inPath = true; return next;
      });
    }
  }, []);

  const handleComplete = useCallback(() => {
    setStepDesc(pathRef.current.size > 0 ? `Path found! Length: ${pathRef.current.size} nodes.` : 'No path found.');
    setStepType('done');
  }, []);

  const playback = usePlayback<PathStep>({
    steps, onStep: handleStep, onComplete: handleComplete, onReset: clearVisualization,
  });

  /* ── Key UX fix: Play button auto-runs algorithm if no steps computed yet ── */
  const handlePlay = useCallback(() => {
    if (steps.length === 0 || !hasRun) {
      // Compute steps fresh, then play
      clearVisualization();
      const newSteps = ALGO_FNS[algorithm](gridRef.current, startPos, endPos);
      setSteps(newSteps);
      setHasRun(true);
      // playback will pick up the new steps on next render
    } else {
      playback.play();
    }
  }, [steps.length, hasRun, algorithm, startPos, endPos, clearVisualization, playback]);

  /* When steps update after compute, auto-start playback */
  useEffect(() => {
    if (hasRun && steps.length > 0 && playback.state === 'idle') {
      playback.play();
    }
  }, [steps]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellEvent = useCallback((row: number, col: number) => {
    if (playback.state === 'playing') return;
    setGrid((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      if (tool === 'start') {
        next[startPos[0]][startPos[1]].type = 'empty'; next[row][col].type = 'start'; setStartPos([row, col]);
      } else if (tool === 'end') {
        next[endPos[0]][endPos[1]].type = 'empty'; next[row][col].type = 'end'; setEndPos([row, col]);
      } else if (tool === 'wall') {
        next[row][col].type = next[row][col].type === 'wall' ? 'empty' : 'wall';
      } else if (tool === 'weight') {
        next[row][col].type = next[row][col].type === 'weight' ? 'empty' : 'weight';
        next[row][col].weight = next[row][col].type === 'weight' ? 3 : 1;
      }
      return next;
    });
    // Invalidate steps when grid changes
    setSteps([]); setHasRun(false);
  }, [tool, startPos, endPos, playback.state]);

  const handleMouseDown  = (row: number, col: number) => { isDrawing.current = true;  handleCellEvent(row, col); };
  const handleMouseEnter = (row: number, col: number) => {
    if (!isDrawing.current || tool !== 'wall') return;
    setGrid((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      if (next[row][col].type === 'empty') next[row][col].type = 'wall';
      return next;
    });
    setSteps([]); setHasRun(false);
  };
  const handleMouseUp = () => { isDrawing.current = false; };

  const clearBoard = () => { playback.reset(); setGrid(createEmptyGrid(startPos, endPos)); setSteps([]); clearVisualization(); };
  const clearPath  = () => { playback.reset(); clearVisualization(); setSteps([]); };
  const generateMaze = () => {
    playback.reset(); clearVisualization(); setSteps([]);
    setGrid((prev) => {
      const next = prev.map((r) => r.map((c) => ({
        ...c, type: c.type as CellType, visited: false, inPath: false,
        distance: Infinity, parent: null as [number,number]|null,
      })));
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if ((r === startPos[0] && c === startPos[1]) || (r === endPos[0] && c === endPos[1])) continue;
        next[r][c].type = Math.random() < 0.3 ? 'wall' : 'empty'; next[r][c].weight = 1;
      }
      next[startPos[0]][startPos[1]].type = 'start'; next[endPos[0]][endPos[1]].type = 'end';
      return next;
    });
  };

  const info = PATH_INFO[algorithm];
  const algoConfig = ALGORITHMS.find(a => a.key === algorithm)!;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-city-bg)', paddingTop: 80, paddingBottom: 56 }}
      onMouseUp={handleMouseUp}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/">
            <motion.button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, background: '#F5ECE0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9B7A50', boxShadow: '0 4px 0 rgba(0,0,0,0.10)' }}
              whileTap={{ y: 3 }}>
              <ChevronLeft size={14} /> Home
            </motion.button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.span style={{ fontSize: 44 }}
              animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>🏙️</motion.span>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1C0A00', margin: 0, lineHeight: 1.1 }}>Pathfinding City</h1>
              <p style={{ fontSize: 14, color: '#9B7A50', margin: '4px 0 0' }}>Draw walls · pick algorithm · hit ▶ Play</p>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 22, display: 'flex', gap: 4 }}>
            {['🏠','🚗','🗺️'].map((e, i) => (
              <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}>{e}</motion.span>
            ))}
          </div>
        </motion.div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Left sidebar ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Algorithm */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <SideLabel>🗺️ Algorithm</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALGORITHMS.map(({ key, label, emoji, color, shadow }) => (
                  <motion.button key={key}
                    onClick={() => { setAlgorithm(key); clearPath(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700, textAlign: 'left',
                      background: algorithm === key ? color : '#F5ECE0',
                      color:      algorithm === key ? '#fff'  : '#9B7A50',
                      boxShadow:  algorithm === key ? `0 4px 0 ${shadow}` : '0 3px 0 rgba(0,0,0,0.08)',
                    }}
                    whileTap={{ y: 3 }}>
                    <span>{emoji}</span> {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <SideLabel>🛠️ Draw Tool</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TOOLS.map(({ key, label, emoji }) => (
                  <motion.button key={key}
                    onClick={() => setTool(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700, textAlign: 'left',
                      background: tool === key ? '#F59E0B' : '#F5ECE0',
                      color:      tool === key ? '#fff'    : '#9B7A50',
                      boxShadow:  tool === key ? '0 4px 0 #B45309' : '0 3px 0 rgba(0,0,0,0.08)',
                    }}
                    whileTap={{ y: 3 }}>
                    {emoji} {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Utility actions */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <SideLabel>⚡ Actions</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <motion.button onClick={generateMaze}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: '#F5ECE0', color: '#9B7A50', boxShadow: '0 3px 0 rgba(0,0,0,0.08)' }}
                  whileTap={{ y: 2 }}>
                  <Shuffle size={13} /> Random Maze
                </motion.button>
                <motion.button onClick={clearPath}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: '#F5ECE0', color: '#9B7A50', boxShadow: '0 3px 0 rgba(0,0,0,0.08)' }}
                  whileTap={{ y: 2 }}>
                  <Eraser size={13} /> Clear Path
                </motion.button>
                <motion.button onClick={clearBoard}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', boxShadow: '0 3px 0 #991B1B' }}
                  whileTap={{ y: 3 }}>
                  <Trash2 size={13} /> Clear Board
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── Center ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

            {/* Grid — fills container width, square cells */}
            <div style={{
              background: '#FFFFFF', borderRadius: 20,
              boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 12px 28px rgba(0,0,0,0.05)',
              padding: 16,
            }}>
              <div
                style={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  width: '100%',
                  userSelect: 'none',
                }}
                onMouseLeave={handleMouseUp}
              >
                {grid.flatMap((row) => row.map((cell) => (
                  <div key={`${cell.row}-${cell.col}`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'background 0.05s',
                      ...getCellStyle(cell),
                    }}
                    onMouseDown={() => handleMouseDown(cell.row, cell.col)}
                    onMouseEnter={() => handleMouseEnter(cell.row, cell.col)}
                  />
                )))}
              </div>
            </div>

            {/* ── Playback — unified component ── */}
            <PlaybackBar
              state={playback.state}
              speed={playback.speed}
              currentStep={playback.currentStep}
              totalSteps={playback.totalSteps}
              onPlay={handlePlay}
              onPause={playback.pause}
              onStep={playback.step}
              onStepBack={playback.stepBack}
              onReset={() => { playback.reset(); clearPath(); }}
              onSpeedChange={playback.setSpeed}
              accentColor={algoConfig.color}
              accentDeep={algoConfig.shadow}
              brainDescription={stepDesc}
              brainStepType={stepType}
            />
          </motion.div>

          {/* ── Right sidebar ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Stats */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <SideLabel>📊 Stats</SideLabel>
              {[
                { label: 'Nodes visited', value: nodesVisited, accent: '#93C5FD' },
                { label: 'Path length',   value: pathLength,   accent: '#FCD34D' },
                { label: 'Grid size',     value: `${ROWS}×${COLS}` },
                { label: 'Total steps',   value: steps.length },
              ].map(({ label, value, accent }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(180,130,80,0.10)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7A50' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: accent ?? '#1C0A00' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Algorithm info */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <SideLabel>📖 {info.name}</SideLabel>
              <p style={{ fontSize: 13, color: '#9B7A50', lineHeight: 1.65, margin: '0 0 16px' }}>{info.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: info.weighted ? '#FEF3C7' : '#F5ECE0', color: info.weighted ? '#B45309' : '#9B7A50' }}>
                  {info.weighted ? '⚖️ Weighted' : 'Unweighted'}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: info.optimal ? '#DCFCE7' : '#FEE2E2', color: info.optimal ? '#15803D' : '#DC2626' }}>
                  {info.optimal ? '✅ Optimal' : '❌ Not Optimal'}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <SideLabel>🗺️ Legend</SideLabel>
              {[['#10B981','Start'],['#EF4444','End'],['#374151','Wall'],['#FDE68A','Weight'],['#93C5FD','Visited'],['#F59E0B','Path']].map(
                ([bg, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(180,130,80,0.08)' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: bg, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7A50' }}>{label}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
