"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, X, RotateCcw } from "lucide-react";

interface FilterPreset {
  id: string;
  name: string;
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  isDefault: boolean;
}

interface FilterPresetsProps {
  currentValues: {
    hue: number;
    saturation: number;
    brightness: number;
    contrast: number;
  };
  onApplyPreset: (preset: FilterPreset) => void;
  onReset: () => void;
  isStaffMode?: boolean;
}

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: "original",
    name: "Original",
    hue: 0,
    saturation: 100,
    brightness: 100,
    contrast: 100,
    isDefault: false,
  },
  {
    id: "warm-glow",
    name: "Warm Glow",
    hue: 15,
    saturation: 120,
    brightness: 105,
    contrast: 110,
    isDefault: false,
  },
  {
    id: "cool-breeze",
    name: "Cool Breeze",
    hue: -15,
    saturation: 90,
    brightness: 110,
    contrast: 100,
    isDefault: false,
  },
  {
    id: "vintage",
    name: "Vintage",
    hue: 20,
    saturation: 70,
    brightness: 95,
    contrast: 90,
    isDefault: false,
  },
  {
    id: "dramatic",
    name: "Dramatic",
    hue: 0,
    saturation: 130,
    brightness: 90,
    contrast: 130,
    isDefault: false,
  },
  {
    id: "soft-dream",
    name: "Soft Dream",
    hue: 10,
    saturation: 80,
    brightness: 115,
    contrast: 85,
    isDefault: false,
  },
];

export function FilterPresets({ currentValues, onApplyPreset, onReset, isStaffMode = false }: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    if (isStaffMode) {
      fetch("/api/presets")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              hue: Number(p.hue),
              saturation: Number(p.saturation),
              brightness: Number(p.brightness),
              contrast: Number(p.contrast),
              isDefault: p.isDefault,
            }));
            setCustomPresets(mapped);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isStaffMode]);

  const allPresets = [...presets, ...customPresets];

  const isActivePreset = (preset: FilterPreset) => {
    return (
      preset.hue === currentValues.hue &&
      preset.saturation === currentValues.saturation &&
      preset.brightness === currentValues.brightness &&
      preset.contrast === currentValues.contrast
    );
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;

    const res = await fetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPresetName.trim(),
        hue: currentValues.hue,
        saturation: currentValues.saturation,
        brightness: currentValues.brightness,
        contrast: currentValues.contrast,
      }),
    });

    if (res.ok) {
      const newPreset = await res.json();
      setCustomPresets((prev) => [...prev, {
        id: newPreset.id,
        name: newPreset.name,
        hue: Number(newPreset.hue),
        saturation: Number(newPreset.saturation),
        brightness: Number(newPreset.brightness),
        contrast: Number(newPreset.contrast),
        isDefault: newPreset.isDefault,
      }]);
      setShowSaveModal(false);
      setNewPresetName("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-mahogany/40 uppercase tracking-wider">
          Filter Preset
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-mahogany/30 hover:text-amber flex items-center gap-1 transition-colors"
          title="Reset ke Original"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-3 gap-2">
        {allPresets.map((preset) => {
          const isActive = isActivePreset(preset);
          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`relative p-2 rounded-xl text-center transition-all duration-200 ${
                isActive
                  ? "bg-amber text-espresso shadow-lg shadow-amber/20"
                  : "bg-cream border border-amber/10 hover:border-amber hover:shadow-md"
              }`}
            >
              {/* Mini preview circles */}
              <div className="flex justify-center gap-1 mb-1.5">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${preset.hue + 45}, ${preset.saturation}%, ${preset.brightness * 0.9}%),
                      hsl(${preset.hue + 180}, ${preset.saturation}%, ${preset.brightness * 0.7}%))`,
                    borderColor: isActive ? "#2D1810" : "#D4872B",
                  }}
                />
              </div>
              <div className={`text-[10px] font-semibold truncate ${isActive ? "text-espresso" : "text-mahogany/60"}`}>
                {preset.name}
              </div>
              {isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-espresso rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-cream" />
                </div>
              )}
              {preset.isDefault && (
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-espresso" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Save Current as Preset (Staff only) */}
      {isStaffMode && (
        <button
          onClick={() => setShowSaveModal(true)}
          className="w-full py-2 text-xs font-semibold text-amber hover:text-amber-glow border border-dashed border-amber/30 hover:border-amber rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Simpan Pengaturan Saat Ini
        </button>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-cream-card rounded-xl p-4 shadow-xl max-w-xs w-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-espresso">Simpan Preset</h4>
              <button onClick={() => setShowSaveModal(false)} className="text-mahogany/30 hover:text-mahogany">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Nama preset..."
              className="w-full px-3 py-2 text-sm border border-amber/20 rounded-lg mb-3 focus:outline-none focus:border-amber"
              autoFocus
            />
            <div className="text-[10px] text-mahogany/40 mb-3">
              <div>Hue: {currentValues.hue}°</div>
              <div>Sat: {currentValues.saturation}%</div>
              <div>Bright: {currentValues.brightness}%</div>
              <div>Contrast: {currentValues.contrast}%</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 text-xs text-mahogany/50 hover:text-mahogany"
              >
                Batal
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="flex-1 py-2 text-xs bg-amber text-espresso rounded-lg font-semibold hover:bg-amber-glow disabled:opacity-40"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset applied indicator
interface PresetBadgeProps {
  presetName?: string;
}

export function PresetBadge({ presetName }: PresetBadgeProps) {
  if (!presetName || presetName === "Original") return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber/10 rounded-full text-[10px] font-semibold text-amber">
      <Sparkles className="w-3 h-3" />
      {presetName}
    </div>
  );
}
