# Optika 🎮

> **Don't memorize algorithms — experience them.**

Optika is an interactive algorithm visualization platform where you can build scenarios, run algorithms, and watch them think step by step. Four fully playable worlds, each with real-time animations, an Algorithm Brain panel that narrates every decision, and scrubbable playback controls.

**Live demo → [imsumeet.github.io/optika](https://imsumeet.github.io/optika/)**

---

## Worlds

### 🏭 Sorting Factory
Watch Bubble Sort, Merge Sort, Quick Sort, and Heap Sort race through your array on a mechanical conveyor belt.

- Generate custom array sizes
- Color-coded bar visualization (comparing / swapping / pivot / sorted)
- Live comparisons + swaps counter
- Speed control from 0.5× to 10×

### 🏙️ Pathfinding City
Draw a city map with walls, weighted roads, and traffic zones, then watch algorithms navigate it.

| Algorithm | Optimal? | Weighted? |
|-----------|----------|-----------|
| BFS | ✅ (unweighted) | ❌ |
| DFS | ❌ | ❌ |
| Dijkstra | ✅ | ✅ |
| A* | ✅ | ✅ |
| Bellman-Ford | ✅ | ✅ |

- Click to draw walls, drag to flood-fill
- Random maze generator
- Path + visited cell coloring

### 🌲 Tree Forest
Build Binary Search Trees and AVL trees node by node, then traverse or search them.

- Insert, delete, and search with animated step-by-step playback
- BST and self-balancing AVL mode (watch rotations happen live)
- Traversals: Pre-order, In-order, Post-order, BFS, DFS
- **Traversal order panel** — node sequence printed as you play

### 🌌 Graph Galaxy
Create custom weighted graphs and run graph algorithms with clear output results.

| Algorithm | Output |
|-----------|--------|
| Dijkstra's | Shortest distance table from source |
| Prim's MST | MST edges + total cost |
| Kruskal's MST | MST edges + total cost |
| Topological Sort | Ordered node sequence |
| Cycle Detection | Cycle found / No cycles |

- Click canvas to add nodes, connect with weighted edges
- Drag nodes to rearrange
- Dashed edge preview while connecting
- Result panel appears after algorithm completes

---

## Features

- **Algorithm Brain** — every step is narrated in plain English ("Comparing 34 and 56 — 56 is larger, moving right")
- **Playback controls** — Play, Pause, Reset, and speed adjustment (0.5× → 10×) on every visualizer
- **Claymorphism design** — warm color palette, soft clay shadows, satisfying button press animations
- **Auto-loaded examples** — Graph Galaxy starts with a sample graph; Tree Forest generates a random tree with one click

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first) |
| Animation | Framer Motion |
| State | Zustand |
| Routing | React Router v7 |
| Deploy | GitHub Pages via GitHub Actions |

---

## Run locally

```bash
git clone https://github.com/IMSUMEET/optika.git
cd optika
npm install
npm run dev
```

Open [http://localhost:5173/optika/](http://localhost:5173/optika/)

---

## Deploy

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages automatically.

```bash
git add .
git commit -m "your message"
git push
```

---

## Project structure

```
src/
├── algorithms/
│   ├── sorting/       # bubbleSort, mergeSort, quickSort, heapSort
│   ├── pathfinding/   # bfs, dfs, dijkstra, astar, bellmanFord
│   ├── tree/          # insertBST, insertAVL, deleteBST, traversals
│   └── graph/         # dijkstraGraph, primMST, kruskalMST, topoSort, cycleDetection
├── components/
│   ├── AlgorithmBrain.tsx   # Step narration panel
│   ├── PlaybackBar.tsx      # Unified play/pause/speed controls
│   └── Navbar.tsx
├── pages/
│   ├── Home.tsx             # World map landing page
│   ├── SortingArena.tsx     # 🏭 Sorting Factory
│   ├── PathfindingWorld.tsx # 🏙️ Pathfinding City
│   ├── TreeExplorer.tsx     # 🌲 Tree Forest
│   └── GraphUniverse.tsx    # 🌌 Graph Galaxy
├── hooks/
│   └── usePlayback.ts       # Generic step-by-step playback engine
└── store/
    └── useStore.ts          # Zustand store
```

---

## Algorithm design patterns

- **Step recording** — each algorithm runs to completion and records every operation as a `Step[]` array before playback begins, enabling rewind and seek
- **Strategy pattern** — algorithms are pure functions `(input) → Step[]`, swapped at runtime with no shared state
- **Observer pattern** — `usePlayback` calls `onStep(step, index)` on each tick, components update only their visual layer

---

Made with ❤️ by [Sumeet Suryawanshi](https://github.com/IMSUMEET)
