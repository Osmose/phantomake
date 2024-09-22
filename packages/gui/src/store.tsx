import { Child, Command } from '@tauri-apps/api/shell';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

let logIndex = 0;

interface LogLine {
  index: number;
  text: string;
}

interface MainStoreState {
  projectDirectory: string | null;
  openProject: (projectDirectory: string) => void;
  closeProject: () => void;

  watchProcess: null | Child;
  watchLogs: LogLine[];
  startWatcher: () => Promise<void>;
  stopWatcher: () => Promise<void>;

  outputDirectory: null | string;
  setOutputDirectory: (outputDirectory: string | null) => void;
}

export const useMainStore = create<MainStoreState>()(
  persist(
    (set, get): MainStoreState => ({
      // Project management
      projectDirectory: null,
      async openProject(projectDirectory) {
        set(() => ({ projectDirectory }));

        // Clean up watch process if it was running
        if (get().watchProcess) {
          await get().stopWatcher();
          set({ watchLogs: [] });
        }
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

        const command = Command.sidecar('bin/phantomake', ['watch', projectDirectory]);
        command.stdout.on('data', (line) =>
          set((state) => {
            return { watchLogs: [...state.watchLogs, { index: logIndex++, text: line }].slice(-1000) };
          })
        );
        command.stderr.on('data', (line) =>
          set((state) => {
            return { watchLogs: [...state.watchLogs, { index: logIndex++, text: line }].slice(-1000) };
          })
        );
        set({ watchProcess: await command.spawn(), watchLogs: [] });
      },
      async stopWatcher() {
        await get().watchProcess?.kill();
        set({ watchProcess: null });
      },

      outputDirectory: null,
      setOutputDirectory: (outputDirectory: string | null) => set({ outputDirectory }),
    }),
    {
      name: 'phantoMainStore',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({ projectDirectory: state.projectDirectory, outputDirectory: state.outputDirectory }),
    }
  )
);
