
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WheelData, WheelOption, SpinDuration, FairnessMode } from '../types';
import { PALETTES, DURATION_VALUES } from '../constants';
import { ArrowLeft, RefreshCcw, Play, RotateCcw } from 'lucide-react';

interface SpinViewProps {
  wheel: WheelData;
  onBack: () => void;
}

const SpinView: React.FC<SpinViewProps> = ({ wheel, onBack }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pickCounts, setPickCounts] = useState<{ [id: string]: number }>({});
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRotationRef = useRef(0);
  const requestRef = useRef<number | undefined>(undefined);
  const lastSegmentRef = useRef<number>(-1);

  const totalWeight = wheel.options.reduce((sum, opt) => sum + opt.weight, 0);
  const isAllEliminated = wheel.config?.fairness === 'elimination' && eliminatedIds.size >= wheel.options.length;

  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 10;
    const colors = wheel.config?.palette === 'custom' ? wheel.config.customColors : PALETTES[wheel.config?.palette as keyof typeof PALETTES] || PALETTES.colorful;

    ctx.clearRect(0, 0, size, size);
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;

    let currentAngle = rotation;
    wheel.options.forEach((option, i) => {
      const sliceAngle = (option.weight / totalWeight) * 2 * Math.PI;
      const isEliminated = wheel.config?.fairness === 'elimination' && eliminatedIds.has(option.id);
      
      ctx.beginPath();
      ctx.fillStyle = isEliminated ? '#f1f5f9' : colors[i % colors.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, currentAngle, currentAngle + sliceAngle);
      ctx.lineTo(center, center);
      ctx.fill();

      // Border for elimination
      if (isEliminated) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(currentAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = isEliminated ? '#cbd5e1' : '#ffffff';
      
      const fontSize = Math.max(10, Math.min(18, sliceAngle * 42));
      ctx.font = `bold ${fontSize}px Inter`;
      ctx.shadowBlur = 0;
      
      if (sliceAngle > 0.04) {
        ctx.fillText(isEliminated ? '✕' : option.label, radius - 20, fontSize / 3);
      }
      ctx.restore();

      currentAngle += sliceAngle;
    });

    // Center Hub
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(center, center, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [wheel, totalWeight, eliminatedIds]);

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [drawWheel]);

  const calculateResultFromRotation = useCallback((finalRotation: number) => {
    let norm = finalRotation % (2 * Math.PI);
    if (norm < 0) norm += 2 * Math.PI;
    const pointerAngle = (3 * Math.PI) / 2;
    let rel = (pointerAngle - norm) % (2 * Math.PI);
    if (rel < 0) rel += 2 * Math.PI;

    let acc = 0;
    for (const option of wheel.options) {
      const arc = (option.weight / totalWeight) * 2 * Math.PI;
      if (rel >= acc && rel < acc + arc) return option;
      acc += arc;
    }
    return wheel.options[0];
  }, [wheel, totalWeight]);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  };

  const animate = useCallback(() => {
    const friction = DURATION_VALUES[wheel.config?.duration || 'medium'] || 0.985;
    
    if (velocityRef.current > 0.0005) {
      rotationRef.current += velocityRef.current;
      velocityRef.current *= friction;
      
      // Haptic tick logic
      const currentRes = calculateResultFromRotation(rotationRef.current);
      const segmentIdx = wheel.options.findIndex(o => o.id === currentRes.id);
      if (segmentIdx !== lastSegmentRef.current) {
        triggerHaptic();
        lastSegmentRef.current = segmentIdx;
      }

      drawWheel(rotationRef.current);
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setIsSpinning(false);
      velocityRef.current = 0;
      rotationRef.current = targetRotationRef.current; // SNAPPING
      drawWheel(rotationRef.current);
      
      const winner = calculateResultFromRotation(rotationRef.current);
      setResult(winner.label);
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
      
      setPickCounts(prev => ({ ...prev, [winner.id]: (prev[winner.id] || 0) + 1 }));
      if (wheel.config?.fairness === 'elimination') {
        setEliminatedIds(prev => new Set(prev).add(winner.id));
      }
    }
  }, [drawWheel, wheel.config, calculateResultFromRotation, wheel.options]);

  const spin = () => {
    if (isSpinning) return;
    const mode = wheel.config?.fairness || 'random';
    
    if (mode === 'elimination' && eliminatedIds.size >= wheel.options.length) {
      resetSession();
      return;
    }

    setResult(null);

    // Filter available options for ELIMINATION
    const effectiveWeights = wheel.options.map(opt => {
      let w = mode === 'elimination' && eliminatedIds.has(opt.id) ? 0 : opt.weight;
      if (mode === 'balanced') w = opt.weight * Math.pow(0.35, pickCounts[opt.id] || 0);
      return { ...opt, effectiveWeight: w };
    });

    const effectiveTotal = effectiveWeights.reduce((s, o) => s + o.effectiveWeight, 0);
    if (effectiveTotal <= 0) { resetSession(); return; }

    let rand = Math.random() * effectiveTotal;
    let winningOption: WheelOption | null = null;
    let winStart = 0, winEnd = 0, currVis = 0, currEff = 0;

    for (const opt of effectiveWeights) {
      const visualArc = (opt.weight / totalWeight) * 2 * Math.PI;
      if (!winningOption && rand >= currEff && rand < currEff + opt.effectiveWeight) {
        winningOption = opt;
        winStart = currVis;
        winEnd = currVis + visualArc;
      }
      currEff += opt.effectiveWeight;
      currVis += visualArc;
    }
    if (!winningOption) winningOption = wheel.options[0];

    const targetInternal = winStart + (winEnd - winStart) * 0.5; // Target perfect center
    const pointerAngle = (3 * Math.PI) / 2;
    let currentRot = rotationRef.current % (2 * Math.PI);
    if (currentRot < 0) currentRot += 2 * Math.PI;

    let distToTarget = (pointerAngle - currentRot - targetInternal) % (2 * Math.PI);
    if (distToTarget < 0) distToTarget += 2 * Math.PI;
    
    const durationMode = wheel.config?.duration || 'medium';
    // Increased fast mode to 12 rotations for much higher top speed
    let extraSpins = Math.PI * 2 * (durationMode === 'instant' ? 1 : (durationMode === 'fast' ? 12 : 5));
    
    const totalDist = distToTarget + extraSpins;
    targetRotationRef.current = rotationRef.current + totalDist;

    const friction = DURATION_VALUES[durationMode] || 0.985;
    const initialVel = totalDist * (1 - friction);

    setIsSpinning(true);
    velocityRef.current = initialVel;
    requestRef.current = requestAnimationFrame(animate);
  };

  const resetSession = () => {
    setPickCounts({});
    setEliminatedIds(new Set());
    setResult(null);
    triggerHaptic();
  };

  return (
    <div className="flex flex-col items-center p-6 h-full">
      <div className="w-full flex justify-between items-center mb-4">
        <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{wheel.title}</h2>
        <button onClick={resetSession} className="p-2 text-slate-400 hover:text-indigo-600 rounded-full">
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="w-full h-32 flex flex-col items-center justify-center">
        {result ? (
          <div className="text-center winner-active">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Result</p>
            <h3 className="text-4xl font-black text-indigo-600 drop-shadow-sm">{result}</h3>
          </div>
        ) : isSpinning ? (
          <div className="text-center animate-pulse">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Spinning...</p>
          </div>
        ) : (
          <div className="text-center opacity-40">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              {isAllEliminated ? 'Reset to spin again' : 'Ready to spin'}
            </p>
          </div>
        )}
      </div>

      <div className="relative mt-2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
          <div className="w-8 h-12 bg-slate-800 rounded-b-full shadow-lg relative flex items-center justify-center">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
          </div>
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-slate-800 mx-auto"></div>
        </div>

        <button 
          onClick={() => isAllEliminated ? resetSession() : spin()}
          disabled={isSpinning}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all bg-white border-4 border-slate-50 ${isSpinning ? 'opacity-80 scale-95' : 'hover:scale-105 active:scale-90 shadow-xl'}`}
        >
          {isSpinning ? (
            <RefreshCcw size={28} className="text-indigo-600 animate-spin" />
          ) : isAllEliminated ? (
            <RotateCcw size={24} className="text-indigo-600" />
          ) : (
            <>
              <Play size={24} className="text-indigo-600 fill-indigo-600 ml-1" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">SPIN</span>
            </>
          )}
        </button>

        <canvas ref={canvasRef} width={350} height={350} className="rounded-full shadow-2xl bg-white border-8 border-white" />
      </div>

      <div className="w-full mt-12 text-center space-y-3">
        <div className="flex flex-wrap justify-center gap-2">
           <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{wheel.config?.duration}</span>
           <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{wheel.config?.fairness}</span>
        </div>
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest px-8">Decision Machine Active</p>
      </div>
    </div>
  );
};

export default SpinView;
