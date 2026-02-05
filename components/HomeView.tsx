
import React from 'react';
import { WheelData } from '../types';
import { Play, Pencil, Trash2, PieChart } from 'lucide-react';

interface HomeViewProps {
  wheels: WheelData[];
  onDelete: (id: string) => void;
  onSpin: (id: string) => void;
  onEdit: (id: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ wheels, onDelete, onSpin, onEdit }) => {
  if (wheels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
        <div className="bg-indigo-100 p-6 rounded-full text-indigo-500 mb-6">
          <PieChart size={64} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No wheels yet</h2>
        <p className="text-slate-500 mb-8">Create your first wheel to start making decisions easier!</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-700 px-1 uppercase tracking-wider text-sm mb-4">Your Decision Wheels</h2>
      {wheels.map((wheel) => (
        <div 
          key={wheel.id} 
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSpin(wheel.id)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <PieChart size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{wheel.title}</h3>
              <p className="text-xs text-slate-400 font-medium uppercase">{wheel.options.length} options</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onSpin(wheel.id)}
              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="Spin"
            >
              <Play size={20} fill="currentColor" />
            </button>
            <button 
              onClick={() => onEdit(wheel.id)}
              className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil size={20} />
            </button>
            <button 
              onClick={() => {
                if(confirm('Delete this wheel?')) onDelete(wheel.id);
              }}
              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeView;
