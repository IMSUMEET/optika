import type { TreeNode, TreeStep } from '../../types';

let nodeIdCounter = 0;

function createNode(value: number): TreeNode {
  return {
    id: `node-${nodeIdCounter++}`,
    value,
    left: null,
    right: null,
    x: 0,
    y: 0,
    height: 1,
    highlighted: false,
  };
}

function getHeight(node: TreeNode | null): number {
  return node ? node.height : 0;
}

function updateHeight(node: TreeNode): void {
  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

function getBalance(node: TreeNode | null): number {
  return node ? getHeight(node.left) - getHeight(node.right) : 0;
}

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function rotateRight(y: TreeNode, steps: TreeStep[]): TreeNode {
  const x = y.left!;
  const T2 = x.right;

  steps.push({ type: 'rotate', nodeId: y.id, value: y.value, description: `Right rotation on ${y.value}`, tree: cloneTree(y) });

  x.right = y;
  y.left = T2;

  updateHeight(y);
  updateHeight(x);

  return x;
}

function rotateLeft(x: TreeNode, steps: TreeStep[]): TreeNode {
  const y = x.right!;
  const T2 = y.left;

  steps.push({ type: 'rotate', nodeId: x.id, value: x.value, description: `Left rotation on ${x.value}`, tree: cloneTree(x) });

  y.left = x;
  x.right = T2;

  updateHeight(x);
  updateHeight(y);

  return y;
}

export function insertBST(root: TreeNode | null, value: number, steps: TreeStep[]): TreeNode {
  if (!root) {
    const node = createNode(value);
    steps.push({ type: 'insert', nodeId: node.id, value, description: `Inserted ${value}`, tree: cloneTree(node) });
    return node;
  }

  steps.push({ type: 'compare', nodeId: root.id, value: root.value, description: `Comparing ${value} with ${root.value}`, tree: cloneTree(root) });

  if (value < root.value) {
    root.left = insertBST(root.left, value, steps);
  } else if (value > root.value) {
    root.right = insertBST(root.right, value, steps);
  } else {
    return root;
  }

  updateHeight(root);
  return root;
}

export function insertAVL(root: TreeNode | null, value: number, steps: TreeStep[]): TreeNode {
  if (!root) {
    const node = createNode(value);
    steps.push({ type: 'insert', nodeId: node.id, value, description: `Inserted ${value}`, tree: cloneTree(node) });
    return node;
  }

  steps.push({ type: 'compare', nodeId: root.id, value: root.value, description: `Comparing ${value} with ${root.value}`, tree: cloneTree(root) });

  if (value < root.value) {
    root.left = insertAVL(root.left, value, steps);
  } else if (value > root.value) {
    root.right = insertAVL(root.right, value, steps);
  } else {
    return root;
  }

  updateHeight(root);
  const balance = getBalance(root);

  if (balance > 1 && value < root.left!.value) {
    steps.push({ type: 'balance', nodeId: root.id, value: root.value, description: `Left-Left case: balance=${balance}`, tree: cloneTree(root) });
    return rotateRight(root, steps);
  }

  if (balance < -1 && value > root.right!.value) {
    steps.push({ type: 'balance', nodeId: root.id, value: root.value, description: `Right-Right case: balance=${balance}`, tree: cloneTree(root) });
    return rotateLeft(root, steps);
  }

  if (balance > 1 && value > root.left!.value) {
    steps.push({ type: 'balance', nodeId: root.id, value: root.value, description: `Left-Right case: balance=${balance}`, tree: cloneTree(root) });
    root.left = rotateLeft(root.left!, steps);
    return rotateRight(root, steps);
  }

  if (balance < -1 && value < root.right!.value) {
    steps.push({ type: 'balance', nodeId: root.id, value: root.value, description: `Right-Left case: balance=${balance}`, tree: cloneTree(root) });
    root.right = rotateRight(root.right!, steps);
    return rotateLeft(root, steps);
  }

  return root;
}

function minValueNode(node: TreeNode): TreeNode {
  let current = node;
  while (current.left) current = current.left;
  return current;
}

export function deleteBST(root: TreeNode | null, value: number, steps: TreeStep[]): TreeNode | null {
  if (!root) {
    steps.push({ type: 'not-found', nodeId: '', value, description: `${value} not found`, tree: null });
    return null;
  }

  steps.push({ type: 'visit', nodeId: root.id, value: root.value, description: `Searching for ${value} at node ${root.value}`, tree: cloneTree(root) });

  if (value < root.value) {
    root.left = deleteBST(root.left, value, steps);
  } else if (value > root.value) {
    root.right = deleteBST(root.right, value, steps);
  } else {
    steps.push({ type: 'delete', nodeId: root.id, value, description: `Deleting ${value}`, tree: cloneTree(root) });

    if (!root.left) return root.right;
    if (!root.right) return root.left;

    const successor = minValueNode(root.right);
    root.value = successor.value;
    root.right = deleteBST(root.right, successor.value, steps);
  }

  updateHeight(root);
  return root;
}

export function searchBST(root: TreeNode | null, value: number, steps: TreeStep[]): boolean {
  if (!root) {
    steps.push({ type: 'not-found', nodeId: '', value, description: `${value} not found in tree`, tree: null });
    return false;
  }

  steps.push({ type: 'visit', nodeId: root.id, value: root.value, description: `Visiting node ${root.value}`, tree: cloneTree(root) });

  if (value === root.value) {
    steps.push({ type: 'found', nodeId: root.id, value, description: `Found ${value}!`, tree: cloneTree(root) });
    return true;
  }

  steps.push({ type: 'compare', nodeId: root.id, value: root.value, description: `${value} ${value < root.value ? '<' : '>'} ${root.value}, going ${value < root.value ? 'left' : 'right'}`, tree: cloneTree(root) });

  return value < root.value ? searchBST(root.left, value, steps) : searchBST(root.right, value, steps);
}

export function preorder(root: TreeNode | null, steps: TreeStep[]): void {
  if (!root) return;
  steps.push({ type: 'visit', nodeId: root.id, value: root.value, description: `Visit ${root.value}`, tree: cloneTree(root) });
  preorder(root.left, steps);
  preorder(root.right, steps);
}

export function inorder(root: TreeNode | null, steps: TreeStep[]): void {
  if (!root) return;
  inorder(root.left, steps);
  steps.push({ type: 'visit', nodeId: root.id, value: root.value, description: `Visit ${root.value}`, tree: cloneTree(root) });
  inorder(root.right, steps);
}

export function postorder(root: TreeNode | null, steps: TreeStep[]): void {
  if (!root) return;
  postorder(root.left, steps);
  postorder(root.right, steps);
  steps.push({ type: 'visit', nodeId: root.id, value: root.value, description: `Visit ${root.value}`, tree: cloneTree(root) });
}

export function bfsTraversal(root: TreeNode | null, steps: TreeStep[]): void {
  if (!root) return;
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    steps.push({ type: 'visit', nodeId: node.id, value: node.value, description: `Visit ${node.value}`, tree: cloneTree(root) });
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}

export function dfsTraversal(root: TreeNode | null, steps: TreeStep[]): void {
  if (!root) return;
  const stack: TreeNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    steps.push({ type: 'visit', nodeId: node.id, value: node.value, description: `Visit ${node.value}`, tree: cloneTree(root) });
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
}

export function layoutTree(root: TreeNode | null, x = 400, y = 40, spread = 160): void {
  if (!root) return;
  root.x = x;
  root.y = y;
  if (root.left) layoutTree(root.left, x - spread, y + 70, spread * 0.55);
  if (root.right) layoutTree(root.right, x + spread, y + 70, spread * 0.55);
}
