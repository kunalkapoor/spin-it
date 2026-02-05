
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WheelData, WheelOption, SpinDuration, PaletteType, FairnessMode } from '../types';
import { PALETTES } from '../constants';
import { Trash2, Plus, Check, X, Sparkles, Settings2, Palette, Scale } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface WheelEditorProps {
  initialData?: WheelData;
  onSave: (wheel: WheelData) => void;
  onCancel: () => void;
}

const WheelEditor: React.FC<WheelEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [options, setOptions] = useState<WheelOption[]>(
    initialData?.options || [
      { id: Math.random().toString(36).substr(2, 9), label: '', weight: 1 }
    ]
  );
  
  const [duration, setDuration] = useState<SpinDuration>(initialData?.config?.duration || 'medium');
  const [palette, setPalette] = useState<PaletteType>(initialData?.config?.palette || 'colorful');
  const [fairness, setFairness] = useState<FairnessMode>(initialData?.config?.fairness || 'random');
  const [customColors, setCustomColors] = useState<string[]>(initialData?.config?.customColors || PALETTES.colorful);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (lastAddedId && inputRefs.current[lastAddedId]) {
      inputRefs.current[lastAddedId]?.focus();
      setLastAddedId(null);
    }
  }, [lastAddedId]);

  const addOption = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setOptions([...options, { id: newId, label: '', weight: 1 }]);
    setLastAddedId(newId);
  };

  const removeOption = (id: string) => {
    if (options.length <= 1) return;
    setOptions(options.filter(o => o.id !== id));
  };

  const updateOption = (id: string, label: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, label } : o));
  };

  const updateWeight = (id: string, weight: string) => {
    const val = parseFloat(weight) || 1;
    setOptions(options.map(o => o.id === id ? { ...o, weight: val } : o));
  };

  const getOptionColor = (index: number) => {
    const colors = palette === 'custom' ? customColors : PALETTES[palette as keyof typeof PALETTES] || PALETTES.colorful;
    return colors[index % colors.length];
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    const filteredOptions = options.filter(o => o.label.trim() !== '');
    if (filteredOptions.length < 2) {
      alert("Please enter at least 2 options");
      return;
    }

    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      options: filteredOptions,
      createdAt: initialData?.createdAt || Date.now(),
      config: { duration, palette, fairness, customColors }
    });
  };

  const handleMagicSuggest = async () => {
    if (!title.trim()) {
      alert("Enter a category name (like 'Dinner Ideas') first!");
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest 6 common options for a roulette wheel titled "${title}". Keep each item under 15 characters.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const suggested: string[] = JSON.parse(response.text.trim());
      const newOptions = suggested.map((label) => ({
        id: Math.random().toString(36).substr(2, 9),
        label,
        weight: 1
      }));
      setOptions(newOptions);
    } catch (e) {
      console.error(e);
      alert("Couldn't generate suggestions. Try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">
          {initialData ? 'Edit Wheel' : 'New Wheel'}
        </h2>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wheel Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dinner Tonight"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-slate-800"
          />
        </div>

        {/* Options Area */}
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Options & Weights</label>
            <button 
              onClick={handleMagicSuggest}
              disabled={isGenerating}
              className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              <Sparkles size={12} />
              {isGenerating ? 'Generating...' : 'Magic Suggest'}
            </button>
          </div>
          
          {options.map((option, idx) => (
            <div key={option.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 fade-in duration-200">
              <div 
                className="w-10 h-10 rounded-lg flex-shrink-0 border border-slate-100 shadow-sm"
                style={{ backgroundColor: getOptionColor(idx) }}
              />
              <div className="relative group flex-shrink-0">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={option.weight}
                  onChange={(e) => updateWeight(option.id, e.target.value)}
                  className="w-12 h-10 rounded-lg border border-slate-200 bg-white text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <input
                ref={el => { inputRefs.current[option.id] = el; }}
                type="text"
                value={option.label}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-800"
              />
              <button 
                onClick={() => removeOption(option.id)}
                disabled={options.length <= 1}
                className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          
          <button 
            onClick={addOption}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-400 transition-all text-sm font-bold"
          >
            <Plus size={18} />
            Add Option
          </button>
        </div>

        {/* Configuration Section */}
        <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm mb-1">
            <Settings2 size={16} />
            Wheel Settings
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Spin Speed</label>
              <div className="grid grid-cols-4 gap-2">
                {(['slow', 'medium', 'fast', 'instant'] as SpinDuration[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${duration === d ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fairness Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['random', 'balanced', 'elimination'] as FairnessMode[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFairness(f)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${fairness === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                  >
                    <Scale size={12} />
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 px-1 leading-relaxed">
                {fairness === 'random' && 'Pure luck. Every spin uses original weights.'}
                {fairness === 'balanced' && 'Reduces the chance of getting the same result twice in a row.'}
                {fairness === 'elimination' && 'Selected options are removed from the next spin until reset.'}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color Palette</label>
              <div className="grid grid-cols-3 gap-2">
                {(['colorful', 'monochrome', 'muted'] as PaletteType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPalette(p)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${palette === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                  >
                    <Palette size={12} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-4 px-6 rounded-2xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Save Wheel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WheelEditor;
