import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Shuffle, ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dijkstraGraph, primMST, kruskalMST, topologicalSort, cycleDetection, GRAPH_INFO } from '../algorithms/graph';
import { usePlayback } from '../hooks/usePlayback';
import { useStore } from '../store/useStore';
import type { GraphNode, GraphEdge, GraphStep, GraphAlgorithm } from '../types';

type Mode = 'add-node' | 'add-edge' | 'move' | 'delete';

const NODE_R = 24;

/* ── Colours ── */
function nodeColor(node: GraphNode, hl: Set<string>, stepType: string | null): string {
  if (node.color === 'red')     return '#F87171';
  if (node.color === 'emerald') return '#34D399';
  if (hl.has(node.id)) {
    if (stepType === 'cycle')       return '#F87171';
    if (stepType === 'add-to-mst')  return '#34D399';
    return '#FBBF24';
  }
  if (node.visited) return '#A78BFA';
  return '#8B5CF6';
}

function edgeColor(edge: GraphEdge, hl: Set<string>, stepType: string | null): string {
  if (edge.highlighted && stepType === 'add-to-mst') return '#34D399';
  if (edge.highlighted && stepType === 'reject')     return 'rgba(248,113,113,0.4)';
  if (hl.has(edge.id) || edge.highlighted)           return '#FBBF24';
  return '#C4B5FD';
}

let nid = 0; const nxtN = () => `n-${++nid}-${Date.now()}`;
let eid = 0; const nxtE = () => `e-${++eid}-${Date.now()}`;

const ALGO_CARDS: {
  key: GraphAlgorithm; label: string; emoji: string;
  tagline: string; description: string; outputHint: string;
}[] = [
  {
    key: 'dijkstra', label: "Dijkstra's", emoji: '📏',
    tagline: 'Shortest paths',
    description: 'Finds the minimum-cost path from a source node to every other node. Works on weighted, undirected graphs.',
    outputHint: 'Shows distances from source',
  },
  {
    key: 'prim', label: "Prim's MST", emoji: '🌿',
    tagline: 'Minimum spanning tree',
    description: 'Grows a tree by always picking the cheapest edge that connects a new node. Result connects all nodes at minimum total cost.',
    outputHint: 'Shows MST edges + total cost',
  },
  {
    key: 'kruskal', label: "Kruskal's MST", emoji: '🔗',
    tagline: 'Minimum spanning tree',
    description: 'Sorts all edges by weight, then greedily adds each edge unless it would create a cycle.',
    outputHint: 'Shows MST edges + total cost',
  },
  {
    key: 'topological', label: 'Topological Sort', emoji: '🗂️',
    tagline: 'Node ordering (directed)',
    description: 'Orders nodes so every directed edge goes from earlier to later. Only valid on directed acyclic graphs (DAGs).',
    outputHint: 'Shows the topological order',
  },
  {
    key: 'cycle-detection', label: 'Cycle Detection', emoji: '🔴',
    tagline: 'Find circular dependencies',
    description: 'Uses depth-first search coloring to detect whether any cycle exists in the graph.',
    outputHint: 'Cycle found or not',
  },
];

function sampleGraph(directed: boolean): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const positions = [{ x:200,y:110 },{ x:420,y:90 },{ x:580,y:210 },{ x:470,y:390 },{ x:220,y:360 },{ x:95,y:230 }];
  const labels = ['A','B','C','D','E','F'];
  const nodes: GraphNode[] = positions.map((p, i) => ({ id: nxtN(), ...p, label: labels[i], highlighted: false, visited: false }));
  const defs: [number,number,number][] = [[0,1,4],[1,2,2],[2,3,7],[3,4,1],[4,5,5],[5,0,3],[0,4,8],[1,3,6]];
  const edges: GraphEdge[] = defs.map(([s,t,w]) => ({ id: nxtE(), source: nodes[s].id, target: nodes[t].id, weight: w, highlighted: false, directed }));
  return { nodes, edges };
}

const ALGO_FN: Record<GraphAlgorithm, (g: { nodes: GraphNode[]; edges: GraphEdge[] }, src?: string) => GraphStep[]> = {
  dijkstra:          (g, src) => dijkstraGraph(g, src!),
  prim:              (g) => primMST(g),
  kruskal:           (g) => kruskalMST(g),
  topological:       (g) => topologicalSort(g),
  'cycle-detection': (g) => cycleDetection(g),
};

export function GraphUniverse() {
  const { visitWorld } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes,        setNodes]        = useState<GraphNode[]>([]);
  const [edges,        setEdges]        = useState<GraphEdge[]>([]);
  const [mode,         setMode]         = useState<Mode>('add-node');
  const [algorithm,    setAlgorithm]    = useState<GraphAlgorithm>('dijkstra');
  const [sourceNode,   setSourceNode]   = useState<string>('');
  const [directed,     setDirected]     = useState(false);
  const [edgePending,  setEdgePending]  = useState<string | null>(null);
  const [weightInput,  setWeightInput]  = useState('1');
  const [showWeight,   setShowWeight]   = useState(false);
  const [pendingEdge,  setPendingEdge]  = useState<{ source: string; target: string } | null>(null);
  const [curStep,      setCurStep]      = useState<GraphStep | null>(null);
  const [isComplete,   setIsComplete]   = useState(false);
  const [mousePos,     setMousePos]     = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const nodesRef  = useRef(nodes);  nodesRef.current  = nodes;
  const edgesRef  = useRef(edges);  edgesRef.current  = edges;

  useEffect(() => {
    visitWorld('graph');
    const s = sampleGraph(false);
    setNodes(s.nodes); setEdges(s.edges); setSourceNode(s.nodes[0].id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hlNodes = new Set<string>(curStep?.highlights.nodes ?? []);
  const hlEdges = new Set<string>(curStep?.highlights.edges ?? []);

  const computedSteps = useMemo(() => {
    if (nodes.length === 0) return [];
    try {
      const src = sourceNode || nodes[0]?.id;
      return algorithm === 'dijkstra' ? ALGO_FN.dijkstra({ nodes, edges }, src) : ALGO_FN[algorithm]({ nodes, edges });
    } catch { return []; }
  }, [nodes, edges, algorithm, sourceNode]);

  /* ── Derived result from steps ── */
  const result = useMemo(() => {
    if (computedSteps.length === 0) return null;
    if (algorithm === 'prim' || algorithm === 'kruskal') {
      const mstEdgesList = computedSteps
        .filter((s) => s.type === 'add-to-mst' && s.edgeId)
        .map((s) => {
          const e = edgesRef.current.find((x) => x.id === s.edgeId);
          const a = nodesRef.current.find((x) => x.id === e?.source);
          const b = nodesRef.current.find((x) => x.id === e?.target);
          return { label: `${a?.label ?? '?'} — ${b?.label ?? '?'}`, weight: e?.weight ?? 0 };
        });
      const total = mstEdgesList.reduce((s, e) => s + e.weight, 0);
      return { type: 'mst' as const, edges: mstEdgesList, total };
    }
    if (algorithm === 'topological') {
      const done = computedSteps.find((s) => s.type === 'done');
      const raw = done?.description.replace('Topological order: ', '') ?? '';
      return { type: 'topo' as const, order: raw };
    }
    if (algorithm === 'cycle-detection') {
      const hasCycle = computedSteps.some((s) => s.type === 'cycle');
      return { type: 'cycle' as const, hasCycle };
    }
    if (algorithm === 'dijkstra') {
      const srcLabel = nodesRef.current.find((n) => n.id === (sourceNode || nodesRef.current[0]?.id))?.label ?? '?';
      const distances = computedSteps
        .filter((s) => s.type === 'relax' && s.nodeId)
        .map((s) => {
          const label = nodesRef.current.find((n) => n.id === s.nodeId)?.label ?? '?';
          const m = s.description.match(/distance (\d+)/);
          return { label, dist: m ? parseInt(m[1]) : 0 };
        });
      // dedupe: keep last (lowest) distance per node
      const map = new Map<string, number>();
      map.set(srcLabel, 0);
      for (const d of distances) map.set(d.label, d.dist);
      return { type: 'dijkstra' as const, src: srcLabel, distances: [...map.entries()].sort((a,b) => a[1]-b[1]) };
    }
    return null;
  }, [computedSteps, algorithm, sourceNode]);

  const handleStep = useCallback((step: GraphStep) => {
    setCurStep(step);
    setNodes((prev) => prev.map((n) => ({
      ...n,
      highlighted: step.highlights.nodes.includes(n.id),
      visited: n.visited || step.highlights.nodes.includes(n.id),
      color: step.type === 'cycle' && step.highlights.nodes.includes(n.id) ? 'red'
           : step.type === 'add-to-mst' && step.highlights.nodes.includes(n.id) ? 'emerald'
           : n.color,
    })));
    setEdges((prev) => prev.map((e) => ({ ...e, highlighted: step.highlights.edges.includes(e.id) })));
  }, []);

  const handleComplete = useCallback(() => setIsComplete(true), []);

  const handleReset = useCallback(() => {
    setCurStep(null); setIsComplete(false);
    setNodes((prev) => prev.map((n) => ({ ...n, highlighted: false, visited: false, color: undefined })));
    setEdges((prev) => prev.map((e) => ({ ...e, highlighted: false })));
  }, []);

  const playback = usePlayback<GraphStep>({ steps: computedSteps, onStep: handleStep, onComplete: handleComplete, onReset: handleReset });

  const getSVGCoords = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  /* ── FIXED: click on SVG background adds node regardless of child target ── */
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'add-node') return;
    const t = e.target as Element;
    // Skip if clicking on a node circle or text (not background)
    if (t.tagName === 'circle' || t.tagName === 'text' || t.closest?.('g[data-node]')) return;
    const { x, y } = getSVGCoords(e);
    const label = String.fromCharCode(65 + (nodesRef.current.length % 26));
    setNodes((prev) => [...prev, { id: nxtN(), x, y, label, highlighted: false, visited: false }]);
  }, [mode, getSVGCoords]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (mode === 'delete') {
      setNodes((p) => p.filter((n) => n.id !== nodeId));
      setEdges((p) => p.filter((x) => x.source !== nodeId && x.target !== nodeId));
      if (sourceNode === nodeId) setSourceNode('');
      return;
    }
    if (mode === 'add-edge') {
      if (!edgePending) { setEdgePending(nodeId); }
      else if (edgePending !== nodeId) {
        setPendingEdge({ source: edgePending, target: nodeId });
        setShowWeight(true); setWeightInput('1'); setEdgePending(null);
      }
      return;
    }
    if (mode === 'move') {
      const { x, y } = getSVGCoords(e);
      const node = nodesRef.current.find((n) => n.id === nodeId); if (!node) return;
      dragRef.current = { nodeId, offsetX: x - node.x, offsetY: y - node.y };
    }
  }, [mode, edgePending, sourceNode, getSVGCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const coords = getSVGCoords(e);
    setMousePos(coords);
    if (!dragRef.current) return;
    const { nodeId, offsetX, offsetY } = dragRef.current;
    setNodes((p) => p.map((n) => n.id === nodeId ? { ...n, x: coords.x - offsetX, y: coords.y - offsetY } : n));
  }, [getSVGCoords]);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const handleEdgeClick = useCallback((edgeId: string) => {
    if (mode === 'delete') setEdges((p) => p.filter((e) => e.id !== edgeId));
  }, [mode]);

  const confirmEdge = useCallback(() => {
    if (!pendingEdge) return;
    const w = Math.max(1, parseInt(weightInput) || 1);
    setEdges((p) => [...p, { id: nxtE(), source: pendingEdge.source, target: pendingEdge.target, weight: w, highlighted: false, directed }]);
    setShowWeight(false); setPendingEdge(null);
  }, [pendingEdge, weightInput, directed]);

  const handleClear = useCallback(() => {
    setNodes([]); setEdges([]); setSourceNode(''); setEdgePending(null);
    setCurStep(null); setIsComplete(false); playback.reset();
  }, [playback]);

  const handleSample = useCallback(() => {
    const s = sampleGraph(directed);
    setNodes(s.nodes); setEdges(s.edges); setSourceNode(s.nodes[0].id);
    setEdgePending(null); setCurStep(null); setIsComplete(false); playback.reset();
  }, [directed, playback]);

  const getNodeById = (id: string) => nodes.find((n) => n.id === id);
  const pendingSourceNode = edgePending ? nodes.find((n) => n.id === edgePending) : null;
  const algoCard = ALGO_CARDS.find((a) => a.key === algorithm)!;
  const SPEEDS = [1, 2, 4, 8];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-galaxy-bg)', paddingTop: 80, paddingBottom: 56 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/">
            <motion.button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, background: '#F5ECE0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9B7A50', boxShadow: '0 4px 0 rgba(0,0,0,0.10)' }}
              whileTap={{ y: 3 }}>
              <ChevronLeft size={14} /> Home
            </motion.button>
          </Link>
          <motion.span style={{ fontSize: 38 }}
            animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }}>🌌</motion.span>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1C0A00', margin: 0, lineHeight: 1.1 }}>Graph Galaxy</h1>
            <p style={{ fontSize: 13, color: '#9B7A50', margin: '3px 0 0' }}>Click canvas to add nodes · click two nodes to connect them · press ▶ to run</p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Mode buttons */}
            <div style={{ display: 'flex', background: '#FFFFFF', borderRadius: 14, padding: 4, gap: 3, boxShadow: '0 4px 0 rgba(0,0,0,0.08)' }}>
              {([
                ['add-node', '🪐', 'Add Node'],
                ['add-edge', '🔗', 'Add Edge'],
                ['move',     '✋', 'Move'],
                ['delete',   '🗑️', 'Delete'],
              ] as [Mode, string, string][]).map(([m, emoji, label]) => (
                <motion.button key={m}
                  onClick={() => { setMode(m); setEdgePending(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    background: mode === m ? '#8B5CF6' : 'transparent',
                    color:      mode === m ? '#fff'    : '#9B7A50',
                    boxShadow:  mode === m ? '0 3px 0 #6D28D9' : 'none',
                  }}
                  whileTap={{ y: mode === m ? 2 : 1 }}>
                  {emoji} {label}
                </motion.button>
              ))}
            </div>

            {/* Directed toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#FFFFFF', borderRadius: 10, padding: '7px 12px', boxShadow: '0 4px 0 rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700, color: '#9B7A50' }}>
              <input type="checkbox" checked={directed} onChange={(e) => setDirected(e.target.checked)} style={{ accentColor: '#8B5CF6', width: 13, height: 13 }} />
              Directed
            </label>
            <motion.button onClick={handleSample}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: '#8B5CF6', color: '#fff', boxShadow: '0 4px 0 #6D28D9' }}
              whileTap={{ y: 3 }}>
              <Shuffle size={13} /> Sample
            </motion.button>
            <motion.button onClick={handleClear}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: '#F5ECE0', color: '#9B7A50', boxShadow: '0 4px 0 rgba(0,0,0,0.09)' }}
              whileTap={{ y: 2 }}>
              <Trash2 size={13} /> Clear
            </motion.button>
          </div>
        </motion.div>

        {/* ── Main layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── SVG Canvas + Playback ── */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ background: '#FFFFFF', borderRadius: 22, boxShadow: '0 8px 0 rgba(0,0,0,0.07), 0 16px 40px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>

              {/* Weight prompt */}
              <AnimatePresence>
                {showWeight && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(250,245,255,0.90)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 22 }}>
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                      style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 8px 0 rgba(0,0,0,0.10)', padding: '32px 36px', textAlign: 'center', minWidth: 260 }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>⚖️</div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1C0A00', margin: '0 0 20px' }}>Edge Weight</h3>
                      <input type="number" min={1} value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmEdge(); if (e.key === 'Escape') { setShowWeight(false); setPendingEdge(null); } }}
                        autoFocus
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #E9D5FF', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', marginBottom: 16, background: '#FAF5FF' }} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <motion.button onClick={confirmEdge}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#8B5CF6', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: '0 4px 0 #6D28D9' }}
                          whileTap={{ y: 3 }}>Add Edge</motion.button>
                        <motion.button onClick={() => { setShowWeight(false); setPendingEdge(null); }}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#F5ECE0', color: '#9B7A50', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 0 rgba(0,0,0,0.09)' }}
                          whileTap={{ y: 2 }}>Cancel</motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <svg ref={svgRef}
                style={{ width: '100%', display: 'block', minHeight: 480, height: 'clamp(480px,52vh,580px)', background: 'linear-gradient(135deg,#FAF5FF 0%,#EDE9FE 60%,#F3E8FF 100%)', cursor: mode === 'add-node' ? 'crosshair' : mode === 'delete' ? 'not-allowed' : 'default' }}
                onClick={handleSvgClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { handleMouseUp(); setMousePos(null); }}
              >
                <defs>
                  <marker id="arrow"     markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#C4B5FD" /></marker>
                  <marker id="arrow-hl"  markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#FBBF24" /></marker>
                  <marker id="arrow-mst" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#34D399" /></marker>
                  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(109,40,217,0.20)" />
                  </filter>
                  <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse">
                    <circle cx="18" cy="18" r="0.9" fill="rgba(139,92,246,0.2)" />
                    <circle cx="3"  cy="3"  r="0.5" fill="rgba(139,92,246,0.12)" />
                    <circle cx="33" cy="33" r="0.6" fill="rgba(139,92,246,0.15)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" style={{ pointerEvents: 'none' }} />

                {/* Edges */}
                {edges.map((edge) => {
                  const src = getNodeById(edge.source); const tgt = getNodeById(edge.target);
                  if (!src || !tgt) return null;
                  const dx = tgt.x - src.x; const dy = tgt.y - src.y;
                  const d = Math.sqrt(dx*dx+dy*dy) || 1;
                  const ux = dx/d; const uy = dy/d;
                  const x1 = src.x + ux*NODE_R; const y1 = src.y + uy*NODE_R;
                  const x2 = tgt.x - ux*(NODE_R+(edge.directed?10:0));
                  const y2 = tgt.y - uy*(NODE_R+(edge.directed?10:0));
                  const mx = (src.x+tgt.x)/2; const my = (src.y+tgt.y)/2;
                  const color = edgeColor(edge, hlEdges, curStep?.type ?? null);
                  const sw = hlEdges.has(edge.id) || edge.highlighted ? 3 : 1.5;
                  const markerId = edge.directed ? (color==='#34D399'?'url(#arrow-mst)':color==='#FBBF24'?'url(#arrow-hl)':'url(#arrow)') : '';
                  return (
                    <g key={edge.id}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} className="cursor-pointer"
                        onClick={() => handleEdgeClick(edge.id)} />
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} markerEnd={markerId} style={{ pointerEvents: 'none', transition: 'stroke 0.2s' }} />
                      <g transform={`translate(${mx},${my})`} style={{ pointerEvents: 'none' }}>
                        <rect x={-12} y={-10} width={24} height={20} rx={6} fill="rgba(250,245,255,0.95)" stroke="rgba(139,92,246,0.2)" strokeWidth={1} />
                        <text textAnchor="middle" dominantBaseline="central" fill="#8B5CF6" fontSize={11} fontWeight={700} style={{ userSelect: 'none' }}>{edge.weight}</text>
                      </g>
                    </g>
                  );
                })}

                {/* Pending edge line to mouse cursor */}
                {pendingSourceNode && mousePos && (
                  <line x1={pendingSourceNode.x} y1={pendingSourceNode.y} x2={mousePos.x} y2={mousePos.y}
                    stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6 4" opacity={0.6} style={{ pointerEvents: 'none' }} />
                )}

                {/* Nodes */}
                {nodes.map((node) => {
                  const fill = nodeColor(node, hlNodes, curStep?.type ?? null);
                  const isPending = edgePending === node.id;
                  return (
                    <g key={node.id} data-node={node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      style={{ cursor: mode === 'move' ? 'grab' : 'pointer' }}>
                      {(node.highlighted || isPending) && (
                        <circle cx={node.x} cy={node.y} r={NODE_R+9} fill="none" stroke={isPending ? '#A78BFA' : fill} strokeWidth={2} opacity={0.4}>
                          <animate attributeName="r" from={String(NODE_R+4)} to={String(NODE_R+14)} dur="1s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.45" to="0" dur="1s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={node.x} cy={node.y} r={NODE_R} fill="#FFFFFF" filter="url(#glow)" />
                      <circle cx={node.x} cy={node.y} r={NODE_R} fill={fill}
                        stroke={isPending ? '#A78BFA' : 'rgba(255,255,255,0.35)'} strokeWidth={isPending ? 3 : 2}
                        style={{ transition: 'fill 0.2s' }} />
                      <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                        fill="#FFFFFF" fontSize={14} fontWeight={900} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                        {node.label}
                      </text>
                    </g>
                  );
                })}

                {/* Empty state */}
                {nodes.length === 0 && (
                  <g style={{ pointerEvents: 'none' }}>
                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central" fill="rgba(139,92,246,0.5)" fontSize={36}>🪐</text>
                    <text x="50%" y="54%" textAnchor="middle" dominantBaseline="central" fill="rgba(139,92,246,0.45)" fontSize={14} fontWeight={600}>Click anywhere to add a node</text>
                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="central" fill="rgba(139,92,246,0.3)" fontSize={12}>Or use Sample Graph to start immediately</text>
                  </g>
                )}

                {/* Pending edge hint */}
                {edgePending && (
                  <text x="50%" y="96%" textAnchor="middle" fill="rgba(139,92,246,0.6)" fontSize={12} fontWeight={700} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    Now click the target node to draw an edge
                  </text>
                )}
              </svg>
            </div>

            {/* ── Playback bar ── */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 8px 0 rgba(0,0,0,0.07)', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Brain */}
              {(curStep || isComplete) && (
                <div style={{ padding: '12px 16px', borderRadius: 14, background: isComplete ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.06)', border: `1.5px solid rgba(139,92,246,0.18)`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{isComplete ? '✅' : '💭'}</span>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1C0A00', margin: 0, lineHeight: 1.5 }}>
                    {isComplete ? `${algoCard.label} complete! Check the result panel →` : curStep?.description ?? ''}
                  </p>
                </div>
              )}
              {/* Progress bar */}
              <div style={{ background: '#F0EAE0', borderRadius: 100, height: 8, overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.07)' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 100, background: isComplete ? 'linear-gradient(90deg,#34D399,#06D6A0)' : 'linear-gradient(90deg,#8B5CF6,#C4B5FD)' }}
                  animate={{ width: computedSteps.length > 0 ? `${Math.max(0,(playback.currentStep+1)/computedSteps.length)*100}%` : '0%' }}
                  transition={{ duration: 0.12 }} />
              </div>
              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <motion.button onClick={() => { playback.reset(); handleReset(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#F5ECE0', color: '#9B7A50', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 0 rgba(0,0,0,0.09)' }}
                  whileTap={{ y: 3 }}>
                  <RotateCcw size={14} /> Reset
                </motion.button>
                <motion.button
                  onClick={playback.state === 'playing' ? playback.pause : playback.play}
                  disabled={computedSteps.length === 0}
                  style={{ width: 58, height: 58, borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isComplete ? '#34D399' : '#8B5CF6', color: '#fff', boxShadow: isComplete ? '0 5px 0 #059669' : '0 5px 0 #6D28D9', opacity: computedSteps.length === 0 ? 0.4 : 1 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ y: 4, boxShadow: isComplete ? '0 1px 0 #059669' : '0 1px 0 #6D28D9' }}>
                  {isComplete ? <span style={{ fontSize: 22 }}>✓</span> : playback.state === 'playing' ? <Pause size={22} /> : <Play size={22} style={{ transform: 'translateX(2px)' }} />}
                </motion.button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C4A078' }}>Speed</span>
                  <div style={{ display: 'flex', background: '#F5ECE0', borderRadius: 10, padding: 3, gap: 2 }}>
                    {SPEEDS.map((s) => (
                      <motion.button key={s} onClick={() => playback.setSpeed(s)}
                        style={{ padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, background: playback.speed === s ? '#8B5CF6' : 'transparent', color: playback.speed === s ? '#fff' : '#C4A078', boxShadow: playback.speed === s ? '0 2px 0 #6D28D9' : 'none' }}
                        whileTap={{ y: 1 }}>
                        {s}x
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right panel ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Algorithm selector */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>Choose Algorithm</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALGO_CARDS.map(({ key, label, emoji, tagline }) => (
                  <motion.button key={key}
                    onClick={() => { setAlgorithm(key); handleReset(); playback.reset(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: algorithm === key ? '#F3E8FF' : '#F9F5F0',
                      boxShadow: algorithm === key ? 'inset 0 0 0 2px rgba(139,92,246,0.4)' : 'none',
                    }}
                    whileTap={{ scale: 0.98 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: algorithm === key ? '#6D28D9' : '#1C0A00' }}>{label}</div>
                      <div style={{ fontSize: 11, color: '#9B7A50', marginTop: 1 }}>{tagline}</div>
                    </div>
                    {algorithm === key && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8B5CF6' }}>▶</span>}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* What it does */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
                {algoCard.emoji} What it does
              </p>
              <p style={{ fontSize: 13, color: '#9B7A50', lineHeight: 1.65, margin: '0 0 12px' }}>{algoCard.description}</p>
              <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 100, background: '#F3E8FF', color: '#7C3AED', fontSize: 11, fontWeight: 700 }}>
                📊 {algoCard.outputHint}
              </span>

              {/* Source selector for Dijkstra */}
              {algorithm === 'dijkstra' && nodes.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A50', margin: '0 0 8px' }}>Source node:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {nodes.map((n) => (
                      <motion.button key={n.id}
                        onClick={() => { setSourceNode(n.id); handleReset(); playback.reset(); }}
                        style={{
                          width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 800,
                          background: (sourceNode || nodes[0]?.id) === n.id ? '#8B5CF6' : '#F3E8FF',
                          color:      (sourceNode || nodes[0]?.id) === n.id ? '#fff' : '#7C3AED',
                          boxShadow:  (sourceNode || nodes[0]?.id) === n.id ? '0 3px 0 #6D28D9' : '0 2px 0 rgba(0,0,0,0.08)',
                        }}
                        whileTap={{ y: 2 }}>
                        {n.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Result panel */}
            {isComplete && result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>
                  ✅ Result
                </p>

                {result.type === 'dijkstra' && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A50', margin: '0 0 10px' }}>Distances from {result.src}:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.distances.map(([label, dist]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#FAF5FF' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#6D28D9' }}>{result.src} → {label}</span>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#1C0A00' }}>{dist}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.type === 'mst' && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A50', margin: '0 0 10px' }}>MST Edges:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.edges.map(({ label, weight }, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#F0FDF4' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#1C0A00' }}>w = {weight}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: '#DCFCE7', marginTop: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>Total Cost</span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#065F46' }}>{result.total}</span>
                      </div>
                    </div>
                  </div>
                )}

                {result.type === 'topo' && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A50', margin: '0 0 10px' }}>Topological Order:</p>
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FAF5FF', fontSize: 14, fontWeight: 800, color: '#6D28D9', letterSpacing: '0.02em', lineHeight: 1.8, wordBreak: 'break-all' }}>
                      {result.order || 'No directed edges found. Enable "Directed" and add edges.'}
                    </div>
                  </div>
                )}

                {result.type === 'cycle' && (
                  <div style={{ padding: '16px', borderRadius: 14, background: result.hasCycle ? '#FEF2F2' : '#F0FDF4', border: `2px solid ${result.hasCycle ? '#FCA5A5' : '#86EFAC'}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{result.hasCycle ? '⚠️' : '✅'}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: result.hasCycle ? '#DC2626' : '#15803D' }}>
                      {result.hasCycle ? 'Cycle Detected!' : 'No Cycles Found'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9B7A50', marginTop: 6 }}>
                      {result.hasCycle ? 'This graph has circular dependencies.' : 'This graph is a valid DAG.'}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Stats */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 6px 0 rgba(0,0,0,0.07)', padding: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A078', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Graph Stats</p>
              {[['🪐 Nodes', nodes.length], ['🔗 Edges', edges.length], ['👣 Steps', computedSteps.length]].map(([l, v]) => (
                <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(180,130,80,0.09)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7A50' }}>{l}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1C0A00' }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
