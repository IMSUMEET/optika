// ─── Sorting Types ──────────────────────────────────────────────
export interface SortStep {
  type: 'compare' | 'swap' | 'set' | 'pivot' | 'merge' | 'done' | 'partition';
  indices: number[];
  values?: number[];
  array: number[];
  description: string;
}

export type SortAlgorithm = 'bubble' | 'merge' | 'quick' | 'heap';

export interface SortStats {
  comparisons: number;
  swaps: number;
  arrayAccesses: number;
  timeComplexity: string;
  spaceComplexity: string;
}

// ─── Pathfinding Types ──────────────────────────────────────────
export type CellType = 'empty' | 'wall' | 'start' | 'end' | 'weight' | 'traffic';

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
  weight: number;
  visited: boolean;
  inPath: boolean;
  distance: number;
  parent: [number, number] | null;
  f?: number;
  g?: number;
  h?: number;
}

export interface PathStep {
  type: 'visit' | 'explore' | 'path' | 'done' | 'wall-hit';
  row: number;
  col: number;
  description: string;
  distance?: number;
}

export type PathAlgorithm = 'bfs' | 'dfs' | 'dijkstra' | 'astar' | 'bellman-ford';

// ─── Tree Types ─────────────────────────────────────────────────
export interface TreeNode {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x: number;
  y: number;
  height: number;
  highlighted: boolean;
  color?: string;
}

export interface TreeStep {
  type: 'visit' | 'compare' | 'insert' | 'delete' | 'rotate' | 'found' | 'not-found' | 'balance';
  nodeId: string;
  value: number;
  description: string;
  tree: TreeNode | null;
}

export type TreeAlgorithm = 'bst' | 'avl' | 'heap' | 'trie';
export type TraversalType = 'bfs' | 'dfs' | 'preorder' | 'inorder' | 'postorder';

// ─── Graph Types ────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  highlighted: boolean;
  visited: boolean;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  highlighted: boolean;
  directed: boolean;
}

export interface GraphStep {
  type: 'visit' | 'explore-edge' | 'add-to-mst' | 'relax' | 'reject' | 'cycle' | 'done' | 'sort';
  nodeId?: string;
  edgeId?: string;
  description: string;
  highlights: { nodes: string[]; edges: string[] };
}

export type GraphAlgorithm = 'dijkstra' | 'prim' | 'kruskal' | 'topological' | 'cycle-detection';

// ─── Gamification Types ─────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'sorting' | 'pathfinding' | 'tree' | 'graph' | 'general';
  unlocked: boolean;
  unlockedAt?: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'sorting' | 'pathfinding' | 'tree' | 'graph';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  completed: boolean;
  objective: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  achievements: Achievement[];
  completedMissions: string[];
  algorithmsRun: Record<string, number>;
}

// ─── Engine Types ───────────────────────────────────────────────
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stepping' | 'complete';

export interface PlaybackControls {
  state: PlaybackState;
  speed: number;
  currentStep: number;
  totalSteps: number;
  play: () => void;
  pause: () => void;
  step: () => void;
  stepBack: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (step: number) => void;
}
