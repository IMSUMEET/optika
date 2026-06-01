import type { SortStep } from '../../types';

export function bubbleSort(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ type: 'compare', indices: [j, j + 1], array: [...a], description: `Comparing ${a[j]} and ${a[j + 1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ type: 'swap', indices: [j, j + 1], array: [...a], description: `Swapping ${a[j + 1]} and ${a[j]}` });
      }
    }
  }
  steps.push({ type: 'done', indices: [], array: [...a], description: 'Array sorted!' });
  return steps;
}

export function mergeSort(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];

  function merge(arr: number[], l: number, m: number, r: number) {
    const left = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;

    while (i < left.length && j < right.length) {
      steps.push({ type: 'compare', indices: [l + i, m + 1 + j], array: [...arr], description: `Comparing ${left[i]} and ${right[j]}` });
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      steps.push({ type: 'merge', indices: [k], values: [arr[k]], array: [...arr], description: `Placing ${arr[k]} at position ${k}` });
      k++;
    }

    while (i < left.length) {
      arr[k] = left[i];
      steps.push({ type: 'set', indices: [k], values: [arr[k]], array: [...arr], description: `Placing remaining ${arr[k]}` });
      i++; k++;
    }

    while (j < right.length) {
      arr[k] = right[j];
      steps.push({ type: 'set', indices: [k], values: [arr[k]], array: [...arr], description: `Placing remaining ${arr[k]}` });
      j++; k++;
    }
  }

  function sort(arr: number[], l: number, r: number) {
    if (l < r) {
      const m = Math.floor((l + r) / 2);
      sort(arr, l, m);
      sort(arr, m + 1, r);
      merge(arr, l, m, r);
    }
  }

  sort(a, 0, a.length - 1);
  steps.push({ type: 'done', indices: [], array: [...a], description: 'Array sorted!' });
  return steps;
}

export function quickSort(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];

  function partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    steps.push({ type: 'pivot', indices: [high], array: [...arr], description: `Pivot: ${pivot}` });
    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({ type: 'compare', indices: [j, high], array: [...arr], description: `Comparing ${arr[j]} with pivot ${pivot}` });
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        if (i !== j) {
          steps.push({ type: 'swap', indices: [i, j], array: [...arr], description: `Swapping ${arr[j]} and ${arr[i]}` });
        }
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    steps.push({ type: 'partition', indices: [i + 1], array: [...arr], description: `Pivot ${pivot} placed at position ${i + 1}` });
    return i + 1;
  }

  function sort(arr: number[], low: number, high: number) {
    if (low < high) {
      const pi = partition(arr, low, high);
      sort(arr, low, pi - 1);
      sort(arr, pi + 1, high);
    }
  }

  sort(a, 0, a.length - 1);
  steps.push({ type: 'done', indices: [], array: [...a], description: 'Array sorted!' });
  return steps;
}

export function heapSort(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;

  function heapify(arr: number[], n: number, i: number) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;

    if (l < n) {
      steps.push({ type: 'compare', indices: [l, largest], array: [...arr], description: `Comparing ${arr[l]} with ${arr[largest]}` });
      if (arr[l] > arr[largest]) largest = l;
    }

    if (r < n) {
      steps.push({ type: 'compare', indices: [r, largest], array: [...arr], description: `Comparing ${arr[r]} with ${arr[largest]}` });
      if (arr[r] > arr[largest]) largest = r;
    }

    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      steps.push({ type: 'swap', indices: [i, largest], array: [...arr], description: `Swapping ${arr[largest]} and ${arr[i]}` });
      heapify(arr, n, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(a, n, i);
  }

  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    steps.push({ type: 'swap', indices: [0, i], array: [...a], description: `Moving max ${a[i]} to end` });
    heapify(a, i, 0);
  }

  steps.push({ type: 'done', indices: [], array: [...a], description: 'Array sorted!' });
  return steps;
}

export const SORT_INFO: Record<string, { name: string; time: string; space: string; description: string }> = {
  bubble: { name: 'Bubble Sort', time: 'O(n²)', space: 'O(1)', description: 'Repeatedly swaps adjacent elements if they are in the wrong order.' },
  merge: { name: 'Merge Sort', time: 'O(n log n)', space: 'O(n)', description: 'Divides the array in half, sorts each half, then merges them.' },
  quick: { name: 'Quick Sort', time: 'O(n log n)', space: 'O(log n)', description: 'Picks a pivot, partitions around it, then recursively sorts partitions.' },
  heap: { name: 'Heap Sort', time: 'O(n log n)', space: 'O(1)', description: 'Builds a max-heap, then repeatedly extracts the maximum element.' },
};
