import type { GraphNode, GraphEdge, GraphStep } from '../../types';

interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function dijkstraGraph(graph: Graph, sourceId: string): GraphStep[] {
  const steps: GraphStep[] = [];
  const dist: Record<string, number> = {};
  const visited: Set<string> = new Set();
  const prev: Record<string, string | null> = {};

  for (const node of graph.nodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
  }
  dist[sourceId] = 0;

  const pq = [...graph.nodes.map((n) => n.id)];

  while (pq.length > 0) {
    pq.sort((a, b) => dist[a] - dist[b]);
    const u = pq.shift()!;

    if (dist[u] === Infinity) break;
    visited.add(u);

    steps.push({
      type: 'visit',
      nodeId: u,
      description: `Visiting ${graph.nodes.find((n) => n.id === u)?.label} (dist: ${dist[u]})`,
      highlights: { nodes: [u], edges: [] },
    });

    const outEdges = graph.edges.filter((e) => e.source === u || (!e.directed && e.target === u));

    for (const edge of outEdges) {
      const v = edge.source === u ? edge.target : edge.source;
      if (visited.has(v)) continue;

      steps.push({
        type: 'explore-edge',
        nodeId: v,
        edgeId: edge.id,
        description: `Checking edge to ${graph.nodes.find((n) => n.id === v)?.label} (weight: ${edge.weight})`,
        highlights: { nodes: [u, v], edges: [edge.id] },
      });

      const alt = dist[u] + edge.weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
        steps.push({
          type: 'relax',
          nodeId: v,
          edgeId: edge.id,
          description: `Relaxed ${graph.nodes.find((n) => n.id === v)?.label} to distance ${alt}`,
          highlights: { nodes: [v], edges: [edge.id] },
        });
      }
    }
  }

  steps.push({ type: 'done', description: 'Dijkstra complete!', highlights: { nodes: [...visited], edges: [] } });
  return steps;
}

export function primMST(graph: Graph): GraphStep[] {
  const steps: GraphStep[] = [];
  if (graph.nodes.length === 0) return steps;

  const inMST = new Set<string>();
  const mstEdges: string[] = [];
  const startNode = graph.nodes[0].id;
  inMST.add(startNode);

  steps.push({
    type: 'visit',
    nodeId: startNode,
    description: `Starting Prim's from ${graph.nodes[0].label}`,
    highlights: { nodes: [startNode], edges: [] },
  });

  while (inMST.size < graph.nodes.length) {
    let minEdge: GraphEdge | null = null;
    let minWeight = Infinity;

    for (const edge of graph.edges) {
      const srcIn = inMST.has(edge.source);
      const tgtIn = inMST.has(edge.target);
      if ((srcIn && !tgtIn) || (!srcIn && tgtIn && !edge.directed)) {
        steps.push({
          type: 'explore-edge',
          edgeId: edge.id,
          description: `Considering edge (weight: ${edge.weight})`,
          highlights: { nodes: [edge.source, edge.target], edges: [edge.id] },
        });
        if (edge.weight < minWeight) {
          minWeight = edge.weight;
          minEdge = edge;
        }
      }
    }

    if (!minEdge) break;

    const newNode = inMST.has(minEdge.source) ? minEdge.target : minEdge.source;
    inMST.add(newNode);
    mstEdges.push(minEdge.id);

    steps.push({
      type: 'add-to-mst',
      nodeId: newNode,
      edgeId: minEdge.id,
      description: `Added ${graph.nodes.find((n) => n.id === newNode)?.label} to MST (edge weight: ${minWeight})`,
      highlights: { nodes: [...inMST], edges: [...mstEdges] },
    });
  }

  steps.push({ type: 'done', description: 'MST complete!', highlights: { nodes: [...inMST], edges: mstEdges } });
  return steps;
}

export function kruskalMST(graph: Graph): GraphStep[] {
  const steps: GraphStep[] = [];
  const parent: Record<string, string> = {};
  const rank: Record<string, number> = {};

  for (const node of graph.nodes) {
    parent[node.id] = node.id;
    rank[node.id] = 0;
  }

  function find(x: string): string {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(x: string, y: string): boolean {
    const px = find(x);
    const py = find(y);
    if (px === py) return false;
    if (rank[px] < rank[py]) parent[px] = py;
    else if (rank[px] > rank[py]) parent[py] = px;
    else { parent[py] = px; rank[px]++; }
    return true;
  }

  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const mstEdges: string[] = [];
  const mstNodes: Set<string> = new Set();

  steps.push({ type: 'visit', description: 'Sorting edges by weight...', highlights: { nodes: [], edges: sortedEdges.map((e) => e.id) } });

  for (const edge of sortedEdges) {
    steps.push({
      type: 'explore-edge',
      edgeId: edge.id,
      description: `Considering edge ${graph.nodes.find((n) => n.id === edge.source)?.label}-${graph.nodes.find((n) => n.id === edge.target)?.label} (weight: ${edge.weight})`,
      highlights: { nodes: [edge.source, edge.target], edges: [edge.id] },
    });

    if (union(edge.source, edge.target)) {
      mstEdges.push(edge.id);
      mstNodes.add(edge.source);
      mstNodes.add(edge.target);
      steps.push({
        type: 'add-to-mst',
        edgeId: edge.id,
        description: `Added edge (weight: ${edge.weight}) to MST`,
        highlights: { nodes: [...mstNodes], edges: [...mstEdges] },
      });
    } else {
      steps.push({
        type: 'reject',
        edgeId: edge.id,
        description: `Rejected (would create cycle)`,
        highlights: { nodes: [], edges: [edge.id] },
      });
    }

    if (mstEdges.length === graph.nodes.length - 1) break;
  }

  steps.push({ type: 'done', description: 'MST complete!', highlights: { nodes: [...mstNodes], edges: mstEdges } });
  return steps;
}

export function topologicalSort(graph: Graph): GraphStep[] {
  const steps: GraphStep[] = [];
  const visited = new Set<string>();
  const result: string[] = [];

  const adjList: Record<string, string[]> = {};
  for (const node of graph.nodes) adjList[node.id] = [];
  for (const edge of graph.edges) {
    if (edge.directed) adjList[edge.source].push(edge.target);
  }

  function dfs(nodeId: string) {
    visited.add(nodeId);
    steps.push({
      type: 'visit',
      nodeId,
      description: `Visiting ${graph.nodes.find((n) => n.id === nodeId)?.label}`,
      highlights: { nodes: [nodeId], edges: [] },
    });

    for (const neighbor of adjList[nodeId]) {
      if (!visited.has(neighbor)) {
        const edge = graph.edges.find(
          (e) => e.source === nodeId && e.target === neighbor
        );
        if (edge) {
          steps.push({
            type: 'explore-edge',
            edgeId: edge.id,
            description: `Traversing to ${graph.nodes.find((n) => n.id === neighbor)?.label}`,
            highlights: { nodes: [nodeId, neighbor], edges: [edge.id] },
          });
        }
        dfs(neighbor);
      }
    }

    result.unshift(nodeId);
    steps.push({
      type: 'sort',
      nodeId,
      description: `Added ${graph.nodes.find((n) => n.id === nodeId)?.label} to order`,
      highlights: { nodes: [...result], edges: [] },
    });
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) dfs(node.id);
  }

  steps.push({ type: 'done', description: `Topological order: ${result.map((id) => graph.nodes.find((n) => n.id === id)?.label).join(' → ')}`, highlights: { nodes: result, edges: [] } });
  return steps;
}

export function cycleDetection(graph: Graph): GraphStep[] {
  const steps: GraphStep[] = [];
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color: Record<string, number> = {};

  for (const node of graph.nodes) color[node.id] = WHITE;

  const adjList: Record<string, { target: string; edgeId: string }[]> = {};
  for (const node of graph.nodes) adjList[node.id] = [];
  for (const edge of graph.edges) {
    adjList[edge.source].push({ target: edge.target, edgeId: edge.id });
    if (!edge.directed) {
      adjList[edge.target].push({ target: edge.source, edgeId: edge.id });
    }
  }

  let hasCycle = false;

  function dfs(nodeId: string, parentId: string | null) {
    color[nodeId] = GRAY;
    steps.push({
      type: 'visit',
      nodeId,
      description: `Visiting ${graph.nodes.find((n) => n.id === nodeId)?.label} (GRAY)`,
      highlights: { nodes: [nodeId], edges: [] },
    });

    for (const { target, edgeId } of adjList[nodeId]) {
      if (target === parentId) continue;

      if (color[target] === GRAY) {
        hasCycle = true;
        steps.push({
          type: 'cycle',
          nodeId: target,
          edgeId,
          description: `Cycle detected! Back edge to ${graph.nodes.find((n) => n.id === target)?.label}`,
          highlights: { nodes: [nodeId, target], edges: [edgeId] },
        });
        return;
      }

      if (color[target] === WHITE) {
        steps.push({
          type: 'explore-edge',
          edgeId,
          description: `Exploring edge to ${graph.nodes.find((n) => n.id === target)?.label}`,
          highlights: { nodes: [nodeId, target], edges: [edgeId] },
        });
        dfs(target, nodeId);
        if (hasCycle) return;
      }
    }

    color[nodeId] = BLACK;
  }

  for (const node of graph.nodes) {
    if (color[node.id] === WHITE) {
      dfs(node.id, null);
      if (hasCycle) break;
    }
  }

  steps.push({
    type: 'done',
    description: hasCycle ? 'Cycle detected in the graph!' : 'No cycle found — graph is acyclic!',
    highlights: { nodes: [], edges: [] },
  });

  return steps;
}

export const GRAPH_INFO: Record<string, { name: string; description: string }> = {
  dijkstra: { name: "Dijkstra's Shortest Path", description: 'Finds shortest paths from a source to all other nodes.' },
  prim: { name: "Prim's MST", description: 'Builds minimum spanning tree by growing from a start node.' },
  kruskal: { name: "Kruskal's MST", description: 'Builds MST by adding cheapest edges that don\'t form cycles.' },
  topological: { name: 'Topological Sort', description: 'Linear ordering of vertices for directed acyclic graphs.' },
  'cycle-detection': { name: 'Cycle Detection', description: 'Detects if a cycle exists in the graph using DFS coloring.' },
};
