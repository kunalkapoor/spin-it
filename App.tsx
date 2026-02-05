
import React, { useState, useEffect } from 'react';
import { WheelData, AppView } from './types.ts';
import { STORAGE_KEY } from './constants.ts';
import HomeView from './components/HomeView.tsx';
import WheelEditor from './components/WheelEditor.tsx';
import SpinView from './components/SpinView.tsx';
import { Plus, House } from 'lucide-react';

const GUITAR_NOTES_PRESET: WheelData = {
  id: 'preset-guitar-notes',
  title: 'Guitar Notes',
  options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(note => ({
    id: `note-${note}`,
    label: note,
    weight: 1
  })),
  createdAt: Date.now(),
  config: {
    duration: 'fast',
    palette: 'muted',
    fairness: 'balanced',
    customColors: []
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [wheels, setWheels] = useState<WheelData[]>([]);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWheels(parsed);
        } else {
          setWheels([GUITAR_NOTES_PRESET]);
        }
      } catch (e) {
        setWheels([GUITAR_NOTES_PRESET]);
      }
    } else {
      setWheels([GUITAR_NOTES_PRESET]);
    }
  }, []);

  useEffect(() => {
    if (wheels.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wheels));
    }
  }, [wheels]);

  const handleSaveWheel = (wheel: WheelData) => {
    setWheels(prev => {
      const exists = prev.find(w => w.id === wheel.id);
      if (exists) {
        return prev.map(w => w.id === wheel.id ? wheel : w);
      }
      return [wheel, ...prev];
    });
    setView('home');
  };

  const handleDeleteWheel = (id: string) => {
    setWheels(prev => prev.filter(w => w.id !== id));
  };

  const handleStartSpin = (id: string) => {
    setActiveWheelId(id);
    setView('spin');
  };

  const handleEditWheel = (id: string) => {
    setActiveWheelId(id);
    setView('edit');
  };

  const activeWheel = wheels.find(w => w.id === activeWheelId);

  return (
    <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden md:my-4 md:rounded-[3rem] md:h-[90vh] md:border-[8px] md:border-slate-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">
          Spin <span className="text-indigo-600">It!</span>
        </h1>
        {view !== 'home' && (
          <button 
            onClick={() => setView('home')}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <House size={20} />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {view === 'home' && (
          <HomeView 
            wheels={wheels} 
            onDelete={handleDeleteWheel} 
            onSpin={handleStartSpin} 
            onEdit={handleEditWheel}
          />
        )}
        
        {(view === 'create' || (view === 'edit' && activeWheel)) && (
          <WheelEditor 
            initialData={view === 'edit' ? activeWheel : undefined}
            onSave={handleSaveWheel}
            onCancel={() => setView('home')}
          />
        )}

        {view === 'spin' && activeWheel && (
          <SpinView wheel={activeWheel} onBack={() => setView('home')} />
        )}
      </main>

      {/* Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t px-8 py-4 flex justify-around items-center z-30">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <House size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => setView('create')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'create' || view === 'edit' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Plus size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">New</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
