import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Search, Shuffle, Trash2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  insertBST, insertAVL, deleteBST, searchBST,
  preorder, inorder, postorder, bfsTraversal, dfsTraversal, layoutTree,
} from '../algorithms/tree';
import { PlaybackBar } from '../components/PlaybackBar';
import { usePlayback } from '../hooks/usePlayback';
import { useStore } from '../store/useStore';
import type { TreeNode, TreeStep, TraversalType } from '../types';

const NODE_RADIUS = 26;
const SVG_WIDTH   = 1100;
const SVG_HEIGHT  = 560;

const STEP_COLORS: Record<string, string> = {
  visit:       '#FBBF24',
  compare:     '#FBBF24',
  insert:      '#34D399',
  delete:      '#F87171',
  found:       '#06D6A0',
  'not-found': '#F87171',
  rotate:      '#A78BFA',
  balance:     '#A78BFA',
};

const NODE_DEFAULT_FILL   = '#22C55E';
const NODE_DEFAULT_STROKE = '#15803D';

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
}

function collectNodes(node: TreeNode | null, out: TreeNode[]): void {
  if (!node) return;
  out.push(node);
  collectNodes(node.left, out);
  collectNodes(node.right, out);
}

function collectEdges(node: TreeNode | null, out: { x1: number; y1: number; x2: number; y2: number }[]): void {
  if (!node) return;
  if (node.left)  { out.push({ x1: node.x, y1: node.y, x2: node.left.x,  y2: node.left.y  }); collectEdges(node.left,  out); }
  if (node.right) { out.push({ x1: node.x, y1: node.y, x2: node.right.x, y2: node.right.y }); collectEdges(node.right, out); }
}

export function TreeExplorer() {
  const [root,         setRoot]         = useState<TreeNode | null>(null);
  const [displayRoot,  setDisplayRoot]  = useState<TreeNode | null>(null);
  const [treeMode,     setTreeMode]     = useState<'bst' | 'avl'>('bst');
  const [insertVal,    setInsertVal]    = useState('');
  const [deleteVal,    setDeleteVal]    = useState('');
  const [searchVal,    setSearchVal]    = useState('');
  const [steps,        setSteps]        = useState<TreeStep[]>([]);
  const [description,  setDescription]  = useState('Build a tree to get started.');
  const [stepType,     setStepType]     = useState<string | undefined>(undefined);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [hasInserted,    setHasInserted]    = useState(false);
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [traversalLabel, setTraversalLabel] = useState('');

  const rootRef = useRef(root);
  rootRef.current = root;

  const { addXP, unlockAchievement, recordAlgorithmRun, visitWorld } = useStore();

  useEffect(() => { visitWorld('tree'); }, [visitWorld]);

  const updateDisplay = useCallback((tree: TreeNode | null) => {
    if (tree) { const copy = cloneTree(tree); layoutTree(copy!); setDisplayRoot(copy); }
    else setDisplayRoot(null);
  }, []);

  useEffect(() => { updateDisplay(root); }, [root, updateDisplay]);

  const STRUCTURAL_TYPES = new Set(['insert', 'delete', 'rotate', 'balance', 'not-found']);

  const onStep = useCallback((s: TreeStep) => {
    setDescription(s.description);
    setStepType(s.type);
    setHighlightedId(s.nodeId);
    setHighlightColor(STEP_COLORS[s.type] ?? '#FBBF24');

    // Collect traversal order as we visit nodes
    if (s.type === 'visit') {
      setTraversalOrder((prev) => [...prev, s.value]);
    }

    // Only re-layout the tree for structural changes (insert/delete/rotate).
    // Traversal steps must NOT update displayRoot — the tree snapshot in each
    // traversal step is only the current subtree, which would wipe out the rest.
    if (s.tree && STRUCTURAL_TYPES.has(s.type)) {
      const copy = cloneTree(s.tree);
      layoutTree(copy!);
      setDisplayRoot(copy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = useCallback(() => {
    setDescription((prev) => prev + ' — Done!');
    setTimeout(() => { setHighlightedId(null); setHighlightColor(null); updateDisplay(rootRef.current); }, 600);
  }, [updateDisplay]);

  const onReset = useCallback(() => {
    setHighlightedId(null); setHighlightColor(null);
    setDescription('Ready.'); setStepType(undefined);
    updateDisplay(rootRef.current);
  }, [updateDisplay]);

  const playback = usePlayback<TreeStep>({ steps, onStep, onComplete, onReset });

  const handleInsert = useCallback(() => {
    const val = parseInt(insertVal, 10);
    if (isNaN(val)) return;
    playback.reset();
    const newSteps: TreeStep[] = [];
    const newRoot = treeMode === 'avl'
      ? insertAVL(cloneTree(rootRef.current), val, newSteps)
      : insertBST(cloneTree(rootRef.current), val, newSteps);
    const hadRotation = newSteps.some((s) => s.type === 'rotate');
    setRoot(newRoot); setSteps(newSteps); setInsertVal('');
    if (!hasInserted) { setHasInserted(true); unlockAchievement('tree-hugger'); }
    if (hadRotation) unlockAchievement('balanced');
  }, [insertVal, treeMode, playback, hasInserted, unlockAchievement]);

  const handleDelete = useCallback(() => {
    const val = parseInt(deleteVal, 10);
    if (isNaN(val) || !rootRef.current) return;
    playback.reset();
    const newSteps: TreeStep[] = [];
    const newRoot = deleteBST(cloneTree(rootRef.current), val, newSteps);
    setRoot(newRoot); setSteps(newSteps); setDeleteVal('');
  }, [deleteVal, playback]);

  const handleSearch = useCallback(() => {
    const val = parseInt(searchVal, 10);
    if (isNaN(val) || !rootRef.current) return;
    playback.reset();
    const newSteps: TreeStep[] = [];
    searchBST(cloneTree(rootRef.current), val, newSteps);
    setSteps(newSteps); setSearchVal('');
  }, [searchVal, playback]);

  const TRAVERSAL_LABELS: Record<TraversalType, string> = {
    preorder: 'Pre-order', inorder: 'In-order', postorder: 'Post-order',
    bfs: 'BFS', dfs: 'DFS',
  };

  const handleTraversal = useCallback((type: TraversalType) => {
    if (!rootRef.current) return;
    playback.reset();
    setTraversalOrder([]);
    setTraversalLabel(TRAVERSAL_LABELS[type]);
    const newSteps: TreeStep[] = [];
    const treeCopy = cloneTree(rootRef.current);
    const fns: Record<TraversalType, (r: TreeNode | null, s: TreeStep[]) => void> = {
      preorder, inorder, postorder, bfs: bfsTraversal, dfs: dfsTraversal,
    };
    fns[type](treeCopy, newSteps);
    setSteps(newSteps);
    addXP(10); recordAlgorithmRun(`tree-${type}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback, addXP, recordAlgorithmRun]);

  const handleQuickFill = useCallback(() => {
    playback.reset();
    const count = 7 + Math.floor(Math.random() * 4);
    const values = new Set<number>();
    while (values.size < count) values.add(Math.floor(Math.random() * 99) + 1);
    let newRoot: TreeNode | null = null;
    const allSteps: TreeStep[] = [];
    for (const v of values)
      newRoot = treeMode === 'avl' ? insertAVL(newRoot, v, allSteps) : insertBST(newRoot, v, allSteps);
    if (!hasInserted) { setHasInserted(true); unlockAchievement('tree-hugger'); }
    if (treeMode === 'avl' && allSteps.some((s) => s.type === 'rotate')) unlockAchievement('balanced');
    setRoot(newRoot); setSteps([]); setDescription(`Planted ${count} nodes.`);
    setHighlightedId(null); setHighlightColor(null);
  }, [treeMode, playback, hasInserted, unlockAchievement]);

  const handleClear = useCallback(() => {
    playback.reset(); setRoot(null); setSteps([]);
    setDescription('Forest cleared. Plant new nodes!');
    setHighlightedId(null); setHighlightColor(null); setStepType(undefined);
    setTraversalOrder([]); setTraversalLabel('');
  }, [playback]);

  const nodes: TreeNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (displayRoot) { collectNodes(displayRoot, nodes); collectEdges(displayRoot, edges); }

  return (
    <div className="min-h-screen page-forest" style={{ paddingTop: 88, paddingBottom: 48, paddingLeft: 24, paddingRight: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

          {/* Back */}
          <Link to="/">
            <motion.button
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#F5ECE0', color: '#9B7A50', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 0 rgba(0,0,0,0.10)', flexShrink: 0 }}
              whileTap={{ y: 3 }}>
              <ChevronLeft size={14} /> Home
            </motion.button>
          </Link>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.span style={{ fontSize: 44, lineHeight: 1, flexShrink: 0 }}
              animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}>
              🌲
            </motion.span>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1C0A00', margin: 0, lineHeight: 1.1 }}>Tree Forest</h1>
              <p style={{ fontSize: 14, color: '#9B7A50', margin: '4px 0 0' }}>Grow, search, and traverse binary trees</p>
            </div>
          </div>

          {/* Right side: mode toggle + actions + decorations */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

            {/* BST / AVL pill */}
            <div style={{ display: 'flex', background: '#FFFFFF', borderRadius: 14, padding: 4, gap: 3, boxShadow: '0 5px 0 rgba(0,0,0,0.08)' }}>
              {(['bst','avl'] as const).map((mode) => (
                <motion.button key={mode}
                  onClick={() => setTreeMode(mode)}
                  title={mode === 'bst' ? 'Basic Binary Search Tree' : 'Self-Balancing AVL Tree'}
                  style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 900, letterSpacing: '0.04em',
                    background: treeMode === mode ? '#22C55E' : 'transparent',
                    color:      treeMode === mode ? '#fff'    : '#9B7A50',
                    boxShadow:  treeMode === mode ? '0 4px 0 #15803D' : 'none',
                  }}
                  whileTap={{ y: treeMode === mode ? 3 : 1 }}>
                  {mode.toUpperCase()}
                </motion.button>
              ))}
            </div>

            {/* Random + Clear — top-level actions */}
            <motion.button onClick={handleQuickFill}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, background: '#8B5CF6', color: '#fff', boxShadow: '0 4px 0 #6D28D9' }}
              whileTap={{ y: 3, boxShadow: '0 1px 0 #6D28D9' }}>
              <Shuffle size={13} /> Random Tree
            </motion.button>

            <motion.button onClick={handleClear}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: '#F5ECE0', color: '#9B7A50', boxShadow: '0 4px 0 rgba(0,0,0,0.09)' }}
              whileTap={{ y: 2 }}>
              <Trash2 size={13} /> Clear
            </motion.button>

            {/* Decorations */}
            <div style={{ display: 'flex', gap: 3, fontSize: 20 }}>
              {['🌿','🍃','🌳'].map((e, i) => (
                <motion.span key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}>
                  {e}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Main layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28 }}>

          {/* ── SVG Tree ── */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 8px 0 rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <svg width="100%" height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ background: 'linear-gradient(to bottom, #F0FDF4 0%, #DCFCE7 60%, #BBF7D0 100%)', display: 'block' }}>
                <defs>
                  <filter id="tree-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.15)" />
                  </filter>
                </defs>

                {/* Ground line */}
                <line x1={0} y1={SVG_HEIGHT - 10} x2={SVG_WIDTH} y2={SVG_HEIGHT - 10}
                  stroke="#BBF7D0" strokeWidth={2} />

                {/* Edges (branches) */}
                {edges.map((e, i) => (
                  <line key={i}
                    x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                    stroke="#86EFAC" strokeWidth={3} strokeLinecap="round" />
                ))}

                {/* Nodes */}
                {nodes.map((n) => {
                  const isHL = n.id === highlightedId;
                  const fill   = isHL && highlightColor ? highlightColor : NODE_DEFAULT_FILL;
                  const stroke = isHL ? '#fff' : NODE_DEFAULT_STROKE;
                  return (
                    <g key={n.id} filter="url(#tree-shadow)">
                      {isHL && (
                        <circle cx={n.x} cy={n.y} r={NODE_RADIUS + 8}
                          fill="none" stroke={highlightColor ?? '#22C55E'} strokeWidth={2} opacity={0.45}>
                          <animate attributeName="r" from={String(NODE_RADIUS+4)} to={String(NODE_RADIUS+14)} dur="0.9s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.5" to="0" dur="0.9s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* White clay bg */}
                      <circle cx={n.x} cy={n.y} r={NODE_RADIUS} fill="#FFFFFF" />
                      {/* Colored ring */}
                      <circle cx={n.x} cy={n.y} r={NODE_RADIUS} fill={fill} stroke={stroke} strokeWidth={isHL ? 3 : 2.5}
                        fillOpacity={isHL ? 1 : 0.9} />
                      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                        fill="#FFFFFF" fontSize={14} fontWeight={900} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                        {n.value}
                      </text>
                    </g>
                  );
                })}

                {!displayRoot && (
                  <text x={SVG_WIDTH / 2} y={SVG_HEIGHT / 2} textAnchor="middle"
                    fill="#86EFAC" fontSize={16} fontWeight={600}>
                    🌱 Plant nodes to grow your forest
                  </text>
                )}
              </svg>
            </div>

            {/* Traversal order result — shown as nodes complete */}
            {traversalOrder.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#FFFFFF', borderRadius: 18,
                  boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 12px 28px rgba(0,0,0,0.05)',
                  padding: '20px 24px',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
                  🚶 {traversalLabel} Order
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                  {traversalOrder.map((val, i) => (
                    <motion.div key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#22C55E', color: '#fff',
                        fontSize: 13, fontWeight: 800,
                        boxShadow: '0 3px 0 #15803D',
                      }}>
                        {val}
                      </span>
                      {i < traversalOrder.length - 1 && (
                        <span style={{ fontSize: 14, color: '#C4A078', fontWeight: 700 }}>→</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Playback — brain integrated */}
            {steps.length > 0 && (
              <PlaybackBar state={playback.state} speed={playback.speed}
                currentStep={playback.currentStep} totalSteps={playback.totalSteps}
                onPlay={playback.play} onPause={playback.pause}
                onStep={playback.step} onStepBack={playback.stepBack}
                onReset={playback.reset} onSpeedChange={playback.setSpeed}
                accentColor="#22C55E" accentDeep="#15803D"
                brainDescription={description} brainStepType={stepType} />
            )}
          </motion.div>

          {/* ── Controls — sticky, single scrollable column ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{
              position: 'sticky', top: 88,
              display: 'flex', flexDirection: 'column', gap: 16,
              maxHeight: 'calc(100vh - 108px)', overflowY: 'auto',
              paddingBottom: 4,
            }}>

            {/* ── Operations ── */}
            <div style={{ background: '#FFFFFF', borderRadius: 18, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: '20px 20px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
                🌱 Operations
              </p>

              {/* Insert row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" value={insertVal} onChange={(e) => setInsertVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                  placeholder="➕ Insert value" className="clay-input" style={{ fontSize: 13 }} />
                <motion.button onClick={handleInsert}
                  style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#22C55E', color: '#fff', fontWeight: 900, fontSize: 18, boxShadow: '0 4px 0 #15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  whileTap={{ y: 3, boxShadow: '0 1px 0 #15803D' }}>
                  <Plus size={16} />
                </motion.button>
              </div>

              {/* Delete row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" value={deleteVal} onChange={(e) => setDeleteVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                  placeholder="🗑️ Delete value" className="clay-input" style={{ fontSize: 13 }} />
                <motion.button onClick={handleDelete}
                  style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#F43F5E', color: '#fff', fontWeight: 900, fontSize: 18, boxShadow: '0 4px 0 #BE123C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  whileTap={{ y: 3, boxShadow: '0 1px 0 #BE123C' }}>
                  <Minus size={16} />
                </motion.button>
              </div>

              {/* Search row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="🔍 Search value" className="clay-input" style={{ fontSize: 13 }} />
                <motion.button onClick={handleSearch} disabled={!root}
                  style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#0EA5E9', color: '#fff', fontWeight: 900, boxShadow: '0 4px 0 #0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !root ? 0.4 : 1 }}
                  whileTap={root ? { y: 3, boxShadow: '0 1px 0 #0369A1' } as any : {}}>
                  <Search size={16} />
                </motion.button>
              </div>
            </div>

            {/* ── Traversal ── */}
            <div style={{ background: '#FFFFFF', borderRadius: 18, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: '20px 20px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
                🚶 Traversal — pick one, press Play
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  ['preorder',  'Pre-order'],
                  ['inorder',   'In-order'],
                  ['postorder', 'Post-order'],
                  ['bfs',       'BFS'],
                  ['dfs',       'DFS'],
                ] as [TraversalType, string][]).map(([type, label]) => (
                  <motion.button key={type}
                    onClick={() => handleTraversal(type)}
                    disabled={!root}
                    style={{
                      padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700, textAlign: 'center',
                      background: '#F5ECE0', color: '#9B7A50',
                      boxShadow: '0 3px 0 rgba(0,0,0,0.09)',
                      opacity: !root ? 0.38 : 1,
                    }}
                    whileHover={root ? { background: '#EDE0CC', color: '#1C0A00' } as any : {}}
                    whileTap={root ? { y: 2, boxShadow: '0 1px 0 rgba(0,0,0,0.09)' } as any : {}}>
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Legend ── */}
            <div style={{ background: '#FFFFFF', borderRadius: 18, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
                🎨 Colors
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                {[
                  ['#FBBF24', 'Visiting'],
                  ['#34D399', 'Insert'],
                  ['#F87171', 'Delete'],
                  ['#06D6A0', 'Found'],
                  ['#A78BFA', 'Rotate (AVL)'],
                ].map(([color, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#9B7A50' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
