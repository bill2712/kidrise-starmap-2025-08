import React, { useState, useEffect, useRef, useCallback } from 'react';
import { t } from '../locales/translations';

type ElementType = 'None' | 'Grass' | 'Fire' | 'Water' | 'Lightning' | 'Psychic' | 'Fighting' | 'Darkness' | 'Metal' | 'Dragon' | 'Colorless' | 'Stellar';

const elementThemeMap: Record<ElementType, string> = {
  None: 'border-neutral-800 shadow-none',
  Grass: 'shadow-[0_0_20px_rgba(34,197,94,0.4)] border-green-500',
  Fire: 'shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500',
  Water: 'shadow-[0_0_20px_rgba(59,130,246,0.4)] border-blue-500',
  Lightning: 'shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-400',
  Psychic: 'shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-500',
  Fighting: 'shadow-[0_0_20px_rgba(217,119,6,0.4)] border-amber-600',
  Darkness: 'shadow-[0_0_20px_rgba(31,41,55,0.8)] border-gray-600',
  Metal: 'shadow-[0_0_20px_rgba(156,163,175,0.4)] border-gray-400',
  Dragon: 'shadow-[0_0_20px_rgba(202,138,4,0.4)] border-yellow-600',
  Colorless: 'shadow-[0_0_20px_rgba(226,232,240,0.4)] border-slate-300',
  Stellar: 'shadow-[0_0_20px_rgba(99,102,241,0.4)] border-indigo-400',
};

const typeColors: Record<ElementType, string> = {
  None: 'bg-neutral-800', Grass: 'bg-green-600', Fire: 'bg-red-600', Water: 'bg-blue-600',
  Lightning: 'bg-yellow-400', Psychic: 'bg-purple-600', Fighting: 'bg-amber-700', Darkness: 'bg-gray-800',
  Metal: 'bg-gray-400', Dragon: 'bg-yellow-700', Colorless: 'bg-slate-300', Stellar: 'bg-indigo-500'
};

const typeInitials: Record<ElementType, string> = {
  None: '', Grass: 'G', Fire: 'F', Water: 'W', Lightning: 'L', Psychic: 'P', 
  Fighting: 'Fg', Darkness: 'D', Metal: 'M', Dragon: 'R', Colorless: 'C', Stellar: 'S'
};

interface PlayerState {
  hp: number;
  poisoned: boolean;
  burned: boolean;
  asleep: boolean;
  paralyzed: boolean;
  confused: boolean;
  vstarUsed: boolean;
  gxUsed: boolean;
  aceSpecUsed: boolean;
  abilityUsed: boolean;
  retreatUsed: boolean;
  prizes: boolean[];
  activeType: ElementType;
}

const initialPlayerState = (): PlayerState => ({
  hp: 0,
  poisoned: false,
  burned: false,
  asleep: false,
  paralyzed: false,
  confused: false,
  vstarUsed: false,
  gxUsed: false,
  aceSpecUsed: false,
  abilityUsed: false,
  retreatUsed: false,
  prizes: [true, true, true, true, true, true],
  activeType: 'None',
});

export default function PTCGCounter({ lang = 'en' }: { lang?: string }) {
  const [p1, setP1] = useState<PlayerState>(initialPlayerState());
  const [p2, setP2] = useState<PlayerState>(initialPlayerState());
  
  const [historyP1, setHistoryP1] = useState<PlayerState[]>([]);
  const [historyP2, setHistoryP2] = useState<PlayerState[]>([]);

  const [p1Anim, setP1Anim] = useState(false);
  const [p2Anim, setP2Anim] = useState(false);

  // Match State
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [turnCount, setTurnCount] = useState(1);
  const [firstPlayer, setFirstPlayer] = useState<'p1' | 'p2' | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
  }, []);

  const fireFeedback = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(12);
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  }, []);

  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {}
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    });
    return () => { if (wakeLock !== null) wakeLock.release(); };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const updatePlayer = (player: 'p1' | 'p2', updates: Partial<PlayerState>) => {
    fireFeedback();
    if (player === 'p1') {
      if (updates.hp !== undefined && updates.hp !== p1.hp) {
        setP1Anim(true);
        setTimeout(() => setP1Anim(false), 200);
      }
      setHistoryP1(prev => [...prev, p1].slice(-20));
      setP1(prev => ({ ...prev, ...updates }));
    } else {
      if (updates.hp !== undefined && updates.hp !== p2.hp) {
        setP2Anim(true);
        setTimeout(() => setP2Anim(false), 200);
      }
      setHistoryP2(prev => [...prev, p2].slice(-20));
      setP2(prev => ({ ...prev, ...updates }));
    }
  };

  const undoPlayer = (player: 'p1' | 'p2') => {
    fireFeedback();
    if (player === 'p1' && historyP1.length > 0) {
      setP1(historyP1[historyP1.length - 1]);
      setHistoryP1(prev => prev.slice(0, -1));
    } else if (player === 'p2' && historyP2.length > 0) {
      setP2(historyP2[historyP2.length - 1]);
      setHistoryP2(prev => prev.slice(0, -1));
    }
  };

  const flipCoin = () => {
    if (isFlipping) return;
    fireFeedback();
    setIsFlipping(true);
    setCoinResult(null);
    setTimeout(() => {
      setCoinResult(Math.random() > 0.5 ? 'HEADS' : 'TAILS');
      setIsFlipping(false);
      fireFeedback();
    }, 600);
  };

  const handleNextTurn = () => {
    fireFeedback();
    setTurnCount(prev => prev + 1);
    updatePlayer('p1', { abilityUsed: false, retreatUsed: false });
    setP2(prev => {
      setHistoryP2(h => [...h, prev].slice(-20));
      return { ...prev, abilityUsed: false, retreatUsed: false };
    });
  };

  const PlayerArea = ({ state, player, historyLen, isRotated, isAnim }: { state: PlayerState, player: 'p1' | 'p2', historyLen: number, isRotated: boolean, isAnim: boolean }) => {
    const adjustHp = (amount: number) => updatePlayer(player, { hp: Math.max(0, state.hp + amount) });
    const togglePrize = (index: number) => {
      const newPrizes = [...state.prizes];
      newPrizes[index] = !newPrizes[index];
      updatePlayer(player, { prizes: newPrizes });
    };

    const types: ElementType[] = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless', 'Stellar'];

    return (
      <div className={`flex-1 flex flex-col justify-between p-3 m-2 bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 rounded-2xl relative transition-all duration-300 ${elementThemeMap[state.activeType]} ${isRotated ? 'rotate-180' : ''}`}>
        
        {/* Type Dock */}
        <div className="flex justify-between items-center w-full mb-1">
          <div className="flex gap-1">
            <button onClick={() => updatePlayer(player, { activeType: 'None' })} className="w-4 h-4 rounded-full border border-neutral-700 bg-neutral-800 text-[8px] flex items-center justify-center text-neutral-500 font-bold transition-all hover:bg-neutral-700">x</button>
            {types.map(t => (
              <button 
                key={t} onClick={() => updatePlayer(player, { activeType: t })}
                className={`w-4 h-4 rounded-full border border-neutral-900 shadow-sm transition-all flex items-center justify-center text-[7px] font-black text-white/90 ${typeColors[t]} ${state.activeType === t ? 'scale-125 ring-1 ring-white' : 'opacity-50 grayscale-[50%]'}`}
              >
                {typeInitials[t]}
              </button>
            ))}
          </div>
        </div>

        {/* HP Radar & Turn Mechanics */}
        <div className="flex flex-col w-full mt-1">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-neutral-500 text-[10px] tracking-widest font-bold uppercase">{t(lang, 'damageCounters')}</span>
            <button 
              onClick={() => undoPlayer(player)} 
              disabled={historyLen === 0}
              className={`text-[9px] font-bold tracking-widest uppercase border px-2 py-0.5 rounded transition-all ${historyLen > 0 ? 'text-blue-400 border-blue-900 bg-blue-950/30 active:scale-95' : 'text-neutral-700 border-neutral-800 bg-transparent opacity-50'}`}
            >
              {t(lang, 'undo')}
            </button>
          </div>
          
          <div className="flex items-center justify-between w-full">
            <div className={`bg-red-950 border-4 rounded-xl w-32 h-20 flex flex-col items-center justify-center relative transition-all duration-300 ${state.hp > 0 ? 'border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse' : 'border-red-800 shadow-inner'} ${isAnim ? 'scale-110' : 'scale-100'}`}>
              <span className="text-5xl font-black font-mono tracking-tighter text-red-500" style={{ textShadow: '0 0 15px rgba(239,68,68,0.5)' }}>
                {state.hp}
              </span>
              <button onClick={() => updatePlayer(player, { hp: 0 })} className="absolute bottom-1 right-2 text-neutral-500 text-[8px] hover:text-white uppercase active:scale-95">{t(lang, 'reset')}</button>
            </div>

            <div className="flex flex-col gap-1 w-28">
              <button onClick={() => updatePlayer(player, { retreatUsed: !state.retreatUsed })} className={`h-9 rounded font-bold text-[8px] sm:text-[9px] uppercase tracking-wider border transition-all ${state.retreatUsed ? 'bg-neutral-800 border-neutral-700 text-neutral-500 line-through' : 'bg-neutral-900 border-neutral-600 text-neutral-300'}`}>
                {t(lang, 'retreatUsed')}
              </button>
              <button onClick={() => updatePlayer(player, { abilityUsed: !state.abilityUsed })} className={`h-9 rounded font-bold text-[8px] sm:text-[9px] uppercase tracking-wider border transition-all ${state.abilityUsed ? 'bg-neutral-800 border-neutral-700 text-neutral-500 line-through' : 'bg-rose-950 border-rose-800 text-rose-400'}`}>
                {t(lang, 'ability')}
              </button>
            </div>
          </div>
        </div>

        {/* Prize Cards & Keypad */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="grid grid-cols-6 gap-1 w-full">
            {state.prizes.map((isActive, idx) => (
              <button key={idx} onClick={() => togglePrize(idx)} className={`h-7 rounded font-black text-xs transition-all border ${isActive ? 'bg-indigo-950 border-indigo-500 text-indigo-400' : 'bg-neutral-900 border-neutral-800 text-neutral-700 opacity-25 blur-[0.2px] line-through'}`}>
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 w-full">
            <button onClick={() => adjustHp(-10)} className="h-12 rounded-xl font-black text-lg bg-neutral-800 text-neutral-300 active:scale-95 border border-neutral-700">-10</button>
            <button onClick={() => adjustHp(10)} className="h-12 rounded-xl font-black text-lg bg-emerald-950 text-emerald-400 border border-emerald-800 active:scale-95">+10</button>
            <button onClick={() => adjustHp(50)} className="h-12 rounded-xl font-black text-lg bg-emerald-950 text-emerald-400 border border-emerald-800 active:scale-95">+50</button>
            <button onClick={() => adjustHp(100)} className="h-12 rounded-xl font-black text-lg bg-emerald-950 text-emerald-400 border border-emerald-800 active:scale-95">+100</button>
          </div>
        </div>

        {/* Status Conditions */}
        <div className="grid grid-cols-5 gap-1 w-full mt-2">
          <button onClick={() => updatePlayer(player, { poisoned: !state.poisoned })} className={`h-8 rounded-lg font-bold text-[7px] sm:text-[8px] uppercase tracking-wider border ${state.poisoned ? 'shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-500 bg-green-950/40 text-green-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}>{t(lang, 'poison')}</button>
          <button onClick={() => updatePlayer(player, { burned: !state.burned })} className={`h-8 rounded-lg font-bold text-[7px] sm:text-[8px] uppercase tracking-wider border ${state.burned ? 'shadow-[0_0_15px_rgba(249,115,22,0.6)] border-orange-500 bg-orange-950/40 text-orange-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}>{t(lang, 'burn')}</button>
          <button onClick={() => updatePlayer(player, { asleep: !state.asleep })} className={`h-8 rounded-lg font-bold text-[7px] sm:text-[8px] uppercase tracking-wider border ${state.asleep ? 'shadow-[0_0_15px_rgba(59,130,246,0.6)] border-blue-500 bg-blue-950/40 text-blue-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}>{t(lang, 'asleep')}</button>
          <button onClick={() => updatePlayer(player, { paralyzed: !state.paralyzed })} className={`h-8 rounded-lg font-bold text-[7px] sm:text-[8px] uppercase tracking-wider border ${state.paralyzed ? 'shadow-[0_0_15px_rgba(234,179,8,0.6)] border-yellow-500 bg-yellow-950/40 text-yellow-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}>{t(lang, 'para')}</button>
          <button onClick={() => updatePlayer(player, { confused: !state.confused })} className={`h-8 rounded-lg font-bold text-[7px] sm:text-[8px] uppercase tracking-wider border ${state.confused ? 'shadow-[0_0_15px_rgba(168,85,247,0.6)] border-purple-500 bg-purple-950/40 text-purple-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}>{t(lang, 'confuse')}</button>
        </div>

        {/* Legacy Markers */}
        <div className="flex items-center gap-2 w-full mt-2">
          <button onClick={() => updatePlayer(player, { vstarUsed: !state.vstarUsed })} className={`flex-1 h-9 rounded-lg font-black italic tracking-widest text-xs border-2 transition-all ${state.vstarUsed ? 'grayscale contrast-50 opacity-30 blur-[0.5px] border-neutral-700 bg-neutral-800 text-neutral-500' : 'bg-gradient-to-br from-yellow-200 to-yellow-600 text-neutral-950 border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.5)]'}`}>VSTAR</button>
          <button onClick={() => updatePlayer(player, { gxUsed: !state.gxUsed })} className={`flex-1 h-9 rounded-lg font-black italic tracking-widest text-xs border-2 transition-all ${state.gxUsed ? 'grayscale contrast-50 opacity-30 blur-[0.5px] border-neutral-700 bg-neutral-800 text-neutral-500' : 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`}>GX</button>
          <button onClick={() => updatePlayer(player, { aceSpecUsed: !state.aceSpecUsed })} className={`flex-1 h-9 rounded-lg font-black italic tracking-widest text-xs border-2 transition-all ${state.aceSpecUsed ? 'grayscale contrast-50 opacity-30 blur-[0.5px] border-neutral-700 bg-neutral-800 text-neutral-500' : 'bg-gradient-to-br from-pink-400 to-fuchsia-600 text-white border-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.5)]'}`}>ACE SPEC</button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black w-full h-screen max-w-md mx-auto flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* P2 Area */}
      <PlayerArea state={p2} player="p2" historyLen={historyP2.length} isRotated={true} isAnim={p2Anim} />

      {/* Central Command Console */}
      <div className="h-[110px] w-full flex flex-col justify-between items-center py-1 bg-neutral-950/90 backdrop-blur border-y border-neutral-900 shadow-2xl relative z-50">
        
        {/* Match Timer & Turn Info */}
        <div className="flex items-center justify-between w-full px-2 h-[50px] gap-2">
          
          {/* Turn Engine - Expanded width & padding */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-[130px] gap-1">
            <button onClick={handleNextTurn} className="bg-neutral-800 border border-neutral-600 rounded px-3 py-1 text-white text-[9px] font-bold uppercase tracking-wider active:scale-95 w-full flex justify-between items-center transition-colors hover:bg-neutral-700">
              <span>{t(lang, 'turn')} {turnCount}</span><span>➔</span>
            </button>
            <div className="flex w-full gap-1">
              <button onClick={() => setFirstPlayer('p2')} className={`flex-1 rounded text-[7px] font-bold p-0.5 border transition-colors ${firstPlayer === 'p2' ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>{t(lang, 'p2First')}</button>
              <button onClick={() => setFirstPlayer('p1')} className={`flex-1 rounded text-[7px] font-bold p-0.5 border transition-colors ${firstPlayer === 'p1' ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>{t(lang, 'p1First')}</button>
            </div>
          </div>

          {/* Central Clock */}
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            <span onClick={() => { fireFeedback(); setIsTimerRunning(!isTimerRunning); }} className="text-xl font-mono tracking-widest font-extrabold text-amber-400 cursor-pointer active:scale-95 transition-transform" style={{ textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Coin Flipper - Matched width */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-[130px]">
            <button onClick={flipCoin} className={`w-full py-2 rounded font-black text-[9px] tracking-widest border-2 transition-all ${isFlipping ? 'scale-95 opacity-80 border-neutral-600 bg-neutral-800 animate-pulse text-neutral-400' : coinResult === 'HEADS' ? 'border-cyan-500 bg-cyan-950 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : coinResult === 'TAILS' ? 'border-fuchsia-500 bg-fuchsia-950 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.4)]' : 'border-neutral-700 bg-neutral-900 text-neutral-300'}`}>
              {isFlipping ? t(lang, 'flipping') : coinResult === 'HEADS' ? t(lang, 'heads') : coinResult === 'TAILS' ? t(lang, 'tails') : t(lang, 'flipCoin')}
            </button>
          </div>
        </div>

        {/* Strict AdSense Container (Unchanged length) */}
        <div className="min-w-[320px] min-h-[50px] overflow-hidden bg-neutral-950 border border-dashed border-neutral-700/50 flex items-center justify-center rounded shrink-0">
          <span className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">
            Google AdSense Banner Container
          </span>
        </div>
      </div>

      {/* P1 Area */}
      <PlayerArea state={p1} player="p1" historyLen={historyP1.length} isRotated={false} isAnim={p1Anim} />
      
    </div>
  );
}
