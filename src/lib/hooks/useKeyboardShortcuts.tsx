"use client";

import { useEffect, useCallback } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = target.tagName === "INPUT" ||
                      target.tagName === "TEXTAREA" ||
                      target.tagName === "SELECT" ||
                      target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;

        // For non-modifier keys in inputs, only trigger with ctrl/cmd
        if (isInput && !shortcut.ctrl && !shortcut.meta && keyMatch) {
          continue;
        }

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for photo editor
export const photoEditorShortcuts: Shortcut[] = [
  { key: "s", ctrl: true, handler: () => {}, description: "Save" },
  { key: "z", ctrl: true, handler: () => {}, description: "Undo" },
  { key: "z", ctrl: true, shift: true, handler: () => {}, description: "Redo" },
  { key: "y", ctrl: true, handler: () => {}, description: "Redo" },
  { key: "Escape", handler: () => {}, description: "Deselect / Cancel" },
  { key: "Delete", handler: () => {}, description: "Delete selected" },
  { key: "Backspace", handler: () => {}, description: "Delete selected" },
  { key: "=", ctrl: true, handler: () => {}, description: "Zoom in" },
  { key: "-", ctrl: true, handler: () => {}, description: "Zoom out" },
  { key: "0", ctrl: true, handler: () => {}, description: "Reset zoom" },
  { key: "ArrowUp", shift: true, handler: () => {}, description: "Move up 10px" },
  { key: "ArrowDown", shift: true, handler: () => {}, description: "Move down 10px" },
  { key: "ArrowLeft", shift: true, handler: () => {}, description: "Move left 10px" },
  { key: "ArrowRight", shift: true, handler: () => {}, description: "Move right 10px" },
  { key: "ArrowUp", handler: () => {}, description: "Move up 1px" },
  { key: "ArrowDown", handler: () => {}, description: "Move down 1px" },
  { key: "ArrowLeft", handler: () => {}, description: "Move left 1px" },
  { key: "ArrowRight", handler: () => {}, description: "Move right 1px" },
];

// Frame editor shortcuts
export const frameEditorShortcuts: Shortcut[] = [
  { key: "s", ctrl: true, handler: () => {}, description: "Save slots" },
  { key: "n", ctrl: true, handler: () => {}, description: "New slot" },
  { key: "d", ctrl: true, handler: () => {}, description: "Duplicate slot" },
  { key: "Delete", handler: () => {}, description: "Delete slot" },
  { key: "Escape", handler: () => {}, description: "Deselect" },
  { key: "Tab", handler: () => {}, description: "Next slot" },
  { key: "Tab", shift: true, handler: () => {}, description: "Previous slot" },
  { key: "=", ctrl: true, handler: () => {}, description: "Zoom in" },
  { key: "-", ctrl: true, handler: () => {}, description: "Zoom out" },
  { key: "0", ctrl: true, handler: () => {}, description: "Reset view" },
];

// Keyboard shortcut help modal
export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: Shortcut[] }) {
  const formatShortcut = (shortcut: Shortcut) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("⌘");
    if (shortcut.meta) parts.push("⌘");
    if (shortcut.shift) parts.push("⇧");
    if (shortcut.alt) parts.push("⌥");
    parts.push(shortcut.key.toUpperCase());
    return parts.join("");
  };

  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-600">{shortcut.description}</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
            {formatShortcut(shortcut)}
          </kbd>
        </div>
      ))}
    </div>
  );
}
