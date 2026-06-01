import type { GridCell, PathStep } from '../../types';

type Grid = GridCell[][];

function getNeighbors(grid: Grid, row: number, col: number): GridCell[] {
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const neighbors: GridCell[] = [];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc].type !== 'wall') {
      neighbors.push(grid[nr][nc]);
    }
  }
  return neighbors;
}

function heuristic(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export function bfs(grid: Grid, start: [number, number], end: [number, number]): PathStep[] {
  const steps: PathStep[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  const queue: [number, number][] = [start];
  visited[start[0]][start[1]] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    steps.push({ type: 'visit', row: r, col: c, description: `Visiting (${r}, ${c})` });

    if (r === end[0] && c === end[1]) {
      let cur: [number, number] | null = end;
      while (cur) {
        steps.push({ type: 'path', row: cur[0], col: cur[1], description: `Path node (${cur[0]}, ${cur[1]})` });
        cur = parent[cur[0]][cur[1]];
      }
      steps.push({ type: 'done', row: end[0], col: end[1], description: 'Path found!' });
      return steps;
    }

    for (const n of getNeighbors(grid, r, c)) {
      if (!visited[n.row][n.col]) {
        visited[n.row][n.col] = true;
        parent[n.row][n.col] = [r, c];
        queue.push([n.row, n.col]);
        steps.push({ type: 'explore', row: n.row, col: n.col, description: `Exploring (${n.row}, ${n.col})` });
      }
    }
  }

  steps.push({ type: 'done', row: end[0], col: end[1], description: 'No path found!' });
  return steps;
}

export function dfs(grid: Grid, start: [number, number], end: [number, number]): PathStep[] {
  const steps: PathStep[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  const stack: [number, number][] = [start];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (visited[r][c]) continue;
    visited[r][c] = true;
    steps.push({ type: 'visit', row: r, col: c, description: `Visiting (${r}, ${c})` });

    if (r === end[0] && c === end[1]) {
      let cur: [number, number] | null = end;
      while (cur) {
        steps.push({ type: 'path', row: cur[0], col: cur[1], description: `Path node (${cur[0]}, ${cur[1]})` });
        cur = parent[cur[0]][cur[1]];
      }
      steps.push({ type: 'done', row: end[0], col: end[1], description: 'Path found!' });
      return steps;
    }

    const neighbors = getNeighbors(grid, r, c);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!visited[n.row][n.col]) {
        parent[n.row][n.col] = [r, c];
        stack.push([n.row, n.col]);
        steps.push({ type: 'explore', row: n.row, col: n.col, description: `Adding (${n.row}, ${n.col}) to stack` });
      }
    }
  }

  steps.push({ type: 'done', row: end[0], col: end[1], description: 'No path found!' });
  return steps;
}

export function dijkstra(grid: Grid, start: [number, number], end: [number, number]): PathStep[] {
  const steps: PathStep[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  dist[start[0]][start[1]] = 0;
  const pq: { row: number; col: number; dist: number }[] = [{ row: start[0], col: start[1], dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { row: r, col: c, dist: d } = pq.shift()!;

    if (visited[r][c]) continue;
    visited[r][c] = true;
    steps.push({ type: 'visit', row: r, col: c, description: `Visiting (${r}, ${c}) with distance ${d}`, distance: d });

    if (r === end[0] && c === end[1]) {
      let cur: [number, number] | null = end;
      while (cur) {
        steps.push({ type: 'path', row: cur[0], col: cur[1], description: `Path node (${cur[0]}, ${cur[1]})`, distance: dist[cur[0]][cur[1]] });
        cur = parent[cur[0]][cur[1]];
      }
      steps.push({ type: 'done', row: end[0], col: end[1], description: `Shortest path found! Distance: ${d}` });
      return steps;
    }

    for (const n of getNeighbors(grid, r, c)) {
      const weight = n.weight || 1;
      const newDist = d + weight;
      if (newDist < dist[n.row][n.col]) {
        dist[n.row][n.col] = newDist;
        parent[n.row][n.col] = [r, c];
        pq.push({ row: n.row, col: n.col, dist: newDist });
        steps.push({ type: 'explore', row: n.row, col: n.col, description: `Relaxing (${n.row}, ${n.col}) to distance ${newDist}`, distance: newDist });
      }
    }
  }

  steps.push({ type: 'done', row: end[0], col: end[1], description: 'No path found!' });
  return steps;
}

export function astar(grid: Grid, start: [number, number], end: [number, number]): PathStep[] {
  const steps: PathStep[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const gScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const fScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  gScore[start[0]][start[1]] = 0;
  fScore[start[0]][start[1]] = heuristic(start, end);

  const openSet: { row: number; col: number; f: number }[] = [
    { row: start[0], col: start[1], f: fScore[start[0]][start[1]] },
  ];

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const { row: r, col: c } = openSet.shift()!;

    if (visited[r][c]) continue;
    visited[r][c] = true;

    steps.push({ type: 'visit', row: r, col: c, description: `Visiting (${r}, ${c}) | g=${gScore[r][c]} h=${heuristic([r, c], end)} f=${fScore[r][c]}`, distance: gScore[r][c] });

    if (r === end[0] && c === end[1]) {
      let cur: [number, number] | null = end;
      while (cur) {
        steps.push({ type: 'path', row: cur[0], col: cur[1], description: `Path node (${cur[0]}, ${cur[1]})` });
        cur = parent[cur[0]][cur[1]];
      }
      steps.push({ type: 'done', row: end[0], col: end[1], description: `Path found! Distance: ${gScore[r][c]}` });
      return steps;
    }

    for (const n of getNeighbors(grid, r, c)) {
      const weight = n.weight || 1;
      const tentativeG = gScore[r][c] + weight;
      if (tentativeG < gScore[n.row][n.col]) {
        parent[n.row][n.col] = [r, c];
        gScore[n.row][n.col] = tentativeG;
        fScore[n.row][n.col] = tentativeG + heuristic([n.row, n.col], end);
        openSet.push({ row: n.row, col: n.col, f: fScore[n.row][n.col] });
        steps.push({ type: 'explore', row: n.row, col: n.col, description: `Exploring (${n.row}, ${n.col}) f=${fScore[n.row][n.col]}`, distance: tentativeG });
      }
    }
  }

  steps.push({ type: 'done', row: end[0], col: end[1], description: 'No path found!' });
  return steps;
}

export function bellmanFord(grid: Grid, start: [number, number], end: [number, number]): PathStep[] {
  const steps: PathStep[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const parent: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  dist[start[0]][start[1]] = 0;
  const V = rows * cols;

  for (let iter = 0; iter < V - 1; iter++) {
    let updated = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (dist[r][c] === Infinity) continue;
        if (grid[r][c].type === 'wall') continue;

        for (const n of getNeighbors(grid, r, c)) {
          const weight = n.weight || 1;
          if (dist[r][c] + weight < dist[n.row][n.col]) {
            dist[n.row][n.col] = dist[r][c] + weight;
            parent[n.row][n.col] = [r, c];
            updated = true;
            steps.push({ type: 'explore', row: n.row, col: n.col, description: `Relaxing (${n.row}, ${n.col}) to ${dist[n.row][n.col]}`, distance: dist[n.row][n.col] });
          }
        }
      }
    }
    if (!updated) break;
  }

  if (dist[end[0]][end[1]] < Infinity) {
    let cur: [number, number] | null = end;
    while (cur) {
      steps.push({ type: 'path', row: cur[0], col: cur[1], description: `Path node (${cur[0]}, ${cur[1]})` });
      cur = parent[cur[0]][cur[1]];
    }
    steps.push({ type: 'done', row: end[0], col: end[1], description: `Path found! Distance: ${dist[end[0]][end[1]]}` });
  } else {
    steps.push({ type: 'done', row: end[0], col: end[1], description: 'No path found!' });
  }

  return steps;
}

export const PATH_INFO: Record<string, { name: string; weighted: boolean; optimal: boolean; description: string }> = {
  bfs: { name: 'BFS', weighted: false, optimal: true, description: 'Explores level by level. Guarantees shortest path for unweighted graphs.' },
  dfs: { name: 'DFS', weighted: false, optimal: false, description: 'Explores as deep as possible first. Does NOT guarantee shortest path.' },
  dijkstra: { name: "Dijkstra's", weighted: true, optimal: true, description: 'Explores nearest unvisited node. Guarantees shortest path with non-negative weights.' },
  astar: { name: 'A*', weighted: true, optimal: true, description: 'Uses heuristic to guide search toward goal. Faster than Dijkstra for single-target.' },
  'bellman-ford': { name: 'Bellman-Ford', weighted: true, optimal: true, description: 'Relaxes all edges V-1 times. Handles negative weights.' },
};
