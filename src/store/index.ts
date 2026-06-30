import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Toast notification types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// UI State Store
interface UIState {
  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;

  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Global loading states
  isGlobalLoading: boolean;
  loadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Modal state
  activeModal: string | null;
  modalData: any;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;

  // Preview mode (for quick preview without full editor)
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Dark mode
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: value }),

      // Sidebar
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (value) => set({ isSidebarOpen: value }),

      // Toast notifications
      toasts: [],
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = toast.duration ?? 5000;

        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }

        return id;
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      clearToasts: () => set({ toasts: [] }),

      // Global loading
      isGlobalLoading: false,
      loadingMessage: '',
      setGlobalLoading: (loading, message = '') =>
        set({ isGlobalLoading: loading, loadingMessage: message }),

      // Modal
      activeModal: null,
      modalData: null,
      openModal: (modalId, data = null) =>
        set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Preview mode
      isPreviewMode: false,
      togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
    }),
    {
      name: 'kygoo-ui-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);

// Frame Editor State Store
interface FrameEditorState {
  // Current frame being edited
  selectedFrameId: string | null;
  setSelectedFrameId: (id: string | null) => void;

  // Zoom and pan
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Pan offset
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetPan: () => void;

  // Grid snap
  snapToGrid: boolean;
  gridSize: number;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;

  // Tool mode
  toolMode: 'select' | 'move' | 'resize' | 'create';
  setToolMode: (mode: 'select' | 'move' | 'resize' | 'create') => void;
}

export const useFrameEditorStore = create<FrameEditorState>()((set, get) => ({
  selectedFrameId: null,
  setSelectedFrameId: (id) => set({ selectedFrameId: id }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  zoomIn: () => set((state) => ({ zoom: Math.min(4, state.zoom * 1.25) })),
  zoomOut: () => set((state) => ({ zoom: Math.max(0.25, state.zoom / 1.25) })),
  resetZoom: () => set({ zoom: 1 }),

  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),
  resetPan: () => set({ panOffset: { x: 0, y: 0 } }),

  snapToGrid: true,
  gridSize: 20,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setGridSize: (size) => set({ gridSize: size }),

  toolMode: 'select',
  setToolMode: (mode) => set({ toolMode: mode }),
}));

// Photo Editor State Store
interface PhotoEditorState {
  // Selected slot
  selectedSlotId: string | null;
  setSelectedSlotId: (id: string | null) => void;

  // History for undo/redo
  history: any[];
  historyIndex: number;
  pushHistory: (state: any) => void;
  undo: () => any | null;
  redo: () => any | null;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Active filter preset
  activePresetId: string | null;
  setActivePresetId: (id: string | null) => void;

  // Crop mode
  isCropMode: boolean;
  cropData: { x: number; y: number; width: number; height: number } | null;
  toggleCropMode: () => void;
  setCropData: (data: { x: number; y: number; width: number; height: number } | null) => void;

  // Comparison mode (before/after)
  isCompareMode: boolean;
  toggleCompareMode: () => void;
}

const MAX_HISTORY = 50;

export const usePhotoEditorStore = create<PhotoEditorState>()((set, get) => ({
  selectedSlotId: null,
  setSelectedSlotId: (id) => set({ selectedSlotId: id }),

  history: [],
  historyIndex: -1,
  pushHistory: (state) => {
    set((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state)));
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 });
      return history[historyIndex - 1];
    }
    return null;
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 });
      return history[historyIndex + 1];
    }
    return null;
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  activePresetId: null,
  setActivePresetId: (id) => set({ activePresetId: id }),

  isCropMode: false,
  cropData: null,
  toggleCropMode: () => set((state) => ({ isCropMode: !state.isCropMode })),
  setCropData: (data) => set({ cropData: data }),

  isCompareMode: false,
  toggleCompareMode: () => set((state) => ({ isCompareMode: !state.isCompareMode })),
}));
