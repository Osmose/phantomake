import { Child, Command } from '@tauri-apps/api/shell';
import { create } from 'zustand';
import { basename } from '@tauri-apps/api/path';

interface MainStoreState {
  projectDirectory: string | null;
  projectName: string | null;
  openProject: (projectDirectory: string) => void;
  closeProject: () => void;

  watchProcess: null | Child;
  watchLogs: string[];
  startWatcher: () => Promise<void>;
  stopWatcher: () => Promise<void>;
}

export const useMainStore = create<MainStoreState>((set, get) => ({
  // Project management
  projectDirectory: null,
  projectName: null,
  async openProject(projectDirectory) {
    const projectName = await basename(projectDirectory);
    set(() => ({ projectDirectory, projectName }));
  },
  closeProject() {
    set(() => ({ projectDirectory: null, projectName: null }));
  },

  // Watcher process
  watchProcess: null,
  watchLogs: [],
  async startWatcher() {
    const { projectDirectory, watchProcess } = get();
    if (watchProcess || !projectDirectory) return;

    const command = Command.sidecar('binaries/phantomake', ['watch', projectDirectory]);
    command.stdout.on('data', (line) =>
      set((state) => {
        return { watchLogs: [...state.watchLogs, line].slice(-1000) };
      })
    );
    set({ watchProcess: await command.spawn(), watchLogs: [] });
  },
  async stopWatcher() {
    await get().watchProcess?.kill();
    set({ watchProcess: null });
  },
}));
