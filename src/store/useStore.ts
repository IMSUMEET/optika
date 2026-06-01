import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Achievement, UserProgress } from '../types';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-sort', title: 'First Sort', description: 'Run your first sorting algorithm', icon: '🏁', category: 'sorting', unlocked: false },
  { id: 'speed-demon', title: 'Speed Demon', description: 'Run a sort at maximum speed', icon: '⚡', category: 'sorting', unlocked: false },
  { id: 'sort-master', title: 'Sort Master', description: 'Run all 4 sorting algorithms', icon: '🏆', category: 'sorting', unlocked: false },
  { id: 'pathfinder', title: 'Pathfinder', description: 'Find your first path', icon: '🗺️', category: 'pathfinding', unlocked: false },
  { id: 'maze-runner', title: 'Maze Runner', description: 'Solve a maze with obstacles', icon: '🏃', category: 'pathfinding', unlocked: false },
  { id: 'all-paths', title: 'All Roads Lead...', description: 'Use all 5 pathfinding algorithms', icon: '🌟', category: 'pathfinding', unlocked: false },
  { id: 'tree-hugger', title: 'Tree Hugger', description: 'Build your first tree', icon: '🌳', category: 'tree', unlocked: false },
  { id: 'balanced', title: 'Perfectly Balanced', description: 'Balance an AVL tree', icon: '⚖️', category: 'tree', unlocked: false },
  { id: 'graph-builder', title: 'Graph Builder', description: 'Create your first graph', icon: '📊', category: 'graph', unlocked: false },
  { id: 'mst-found', title: 'Connected World', description: 'Find a minimum spanning tree', icon: '🌐', category: 'graph', unlocked: false },
  { id: 'century', title: 'Century Club', description: 'Earn 100 XP', icon: '💯', category: 'general', unlocked: false },
  { id: 'explorer', title: 'Algorithm Explorer', description: 'Visit all 4 algorithm worlds', icon: '🔭', category: 'general', unlocked: false },
];

interface AppState {
  progress: UserProgress;
  visitedWorlds: Set<string>;
  toastQueue: { id: string; achievement: Achievement }[];

  addXP: (amount: number) => void;
  unlockAchievement: (id: string) => void;
  completeMission: (id: string) => void;
  recordAlgorithmRun: (algo: string) => void;
  visitWorld: (world: string) => void;
  dismissToast: (id: string) => void;
  checkLevelUp: () => boolean;
}

const XP_PER_LEVEL = 50;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: {
        xp: 0,
        level: 1,
        achievements: DEFAULT_ACHIEVEMENTS,
        completedMissions: [],
        algorithmsRun: {},
      },
      visitedWorlds: new Set<string>(),
      toastQueue: [],

      addXP: (amount: number) => {
        set((state) => {
          const newXP = state.progress.xp + amount;
          const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
          return {
            progress: { ...state.progress, xp: newXP, level: newLevel },
          };
        });
        const { progress } = get();
        if (progress.xp >= 100) {
          get().unlockAchievement('century');
        }
      },

      unlockAchievement: (id: string) => {
        const { progress } = get();
        const achievement = progress.achievements.find((a) => a.id === id);
        if (!achievement || achievement.unlocked) return;

        set((state) => ({
          progress: {
            ...state.progress,
            achievements: state.progress.achievements.map((a) =>
              a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
            ),
          },
          toastQueue: [
            ...state.toastQueue,
            { id: `${id}-${Date.now()}`, achievement: { ...achievement, unlocked: true } },
          ],
        }));
      },

      completeMission: (id: string) => {
        set((state) => ({
          progress: {
            ...state.progress,
            completedMissions: [...state.progress.completedMissions, id],
          },
        }));
      },

      recordAlgorithmRun: (algo: string) => {
        set((state) => ({
          progress: {
            ...state.progress,
            algorithmsRun: {
              ...state.progress.algorithmsRun,
              [algo]: (state.progress.algorithmsRun[algo] || 0) + 1,
            },
          },
        }));
      },

      visitWorld: (world: string) => {
        const newVisited = new Set(get().visitedWorlds);
        newVisited.add(world);
        set({ visitedWorlds: newVisited });
        if (newVisited.size >= 4) {
          get().unlockAchievement('explorer');
        }
      },

      dismissToast: (id: string) => {
        set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== id),
        }));
      },

      checkLevelUp: () => {
        const { progress } = get();
        return progress.xp % XP_PER_LEVEL === 0 && progress.xp > 0;
      },
    }),
    {
      name: 'optika-progress',
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
