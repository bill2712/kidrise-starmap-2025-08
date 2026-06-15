import React, { useState, useEffect, useRef, useCallback } from 'react';

// Player state interface
interface PlayerState {
  hp: number;
  poisoned: boolean;
  burned: boolean;
  asleep: boolean;
  paralyzed: boolean;
  confused: boolean;
  vstarUsed: boolean;
  gxUsed: boolean;
  abilityUsed: boolean;
  prizes: boolean[];
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
  abilityUsed: false,
  prizes: [true, true, true, true, true, true],
});

export default function PTCGCounter() {
  const [p1, setP1] = useState<PlayerState>(initialPlayerState());
  const [p2, setP2] = useState<PlayerState>(initialPlayerState());
  
  const [historyP1, setHistoryP1] = useState<PlayerState[]>([]);
  const [historyP2, setHistoryP2] = useState<PlayerState[]>([]);

  const [timeLeft, setTimeLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
  }, []);

  const fireFeedback = useCallback(() => {
    // 1. Native Haptic Engine
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
    // 2. WebAudio Synthesizer (Zero asset loading, ultra-fast)
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

  // Wake Lock for mobile screens
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    });
    return () => {
      if (wakeLock !== null) wakeLock.release();
    };
  }, []);

  // Timer loop
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
      setHistoryP1(prev => [...prev, p1].slice(-20)); // Keep last 20 states
      setP1(prev => ({ ...prev, ...updates }));
    } else {
      setHistoryP2(prev => [...prev, p2].slice(-20));
      setP2(prev => ({ ...prev, ...updates }));
    }
  };

  const undoPlayer = (player: 'p1' | 'p2') => {
    fireFeedback();
    if (player === 'p1') {
      if (historyP1.length === 0) return;
      const last = historyP1[historyP1.length - 1];
      setHistoryP1(prev => prev.slice(0, -1));
      setP1(last);
    } else {
      if (historyP2.length === 0) return;
      const last = historyP2[historyP2.length - 1];
      setHistoryP2(prev => prev.slice(0, -1));
      setP2(last);
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
      fireFeedback(); // Secondary feedback on land
    }, 600);
  };

  const PlayerArea = ({ state, player, historyLen, isRotated }: { state: PlayerState, player: 'p1' | 'p2', historyLen: number, isRotated: boolean }) => {
    const adjustHp = (amount: number) => {
      updatePlayer(player, { hp: Math.max(0, state.hp + amount) });
    };

    const togglePrize = (index: number) => {
      const newPrizes = [...state.prizes];
      newPrizes[index] = !newPrizes[index];
      updatePlayer(player, { prizes: newPrizes });
    };

    return (
      <div className={`flex-1 flex flex-col justify-between p-4 m-2 bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl relative ${isRotated ? 'rotate-180' : ''}`}>
        
        {/* A. Giant HP / Damage Counter Radar */}
        <div className="flex items-end justify-between w-full mt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-neutral-500 text-[10px] tracking-widest font-bold uppercase">Damage Counters</span>
              {historyLen > 0 && (
                <button onClick={() => undoPlayer(player)} className="text-blue-400 hover:text-blue-300 text-[10px] font-bold tracking-widest uppercase border border-blue-900 bg-blue-950/30 px-2 py-0.5 rounded active:scale-95 transition-all">
                  Undo ↩
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-black font-mono tracking-tighter text-red-500" style={{ textShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
                {state.hp}
              </span>
              <button 
                onClick={() => updatePlayer(player, { hp: 0 })}
                className="text-neutral-600 hover:text-neutral-300 text-sm font-bold tracking-widest uppercase active:scale-95 transition-all"
              >
                [RESET]
              </button>
            </div>
          </div>
        </div>

        {/* 2. Twin Side Prize Card Trackers */}
        <div className="w-full mt-3">
          <div className="text-neutral-600 text-[9px] tracking-widest font-bold uppercase mb-1">Prize Cards</div>
          <div className="grid grid-cols-6 gap-1 w-full">
            {state.prizes.map((isActive, idx) => (
              <button 
                key={idx}
                onClick={() => togglePrize(idx)}
                className={`h-8 rounded font-black text-xs transition-all flex items-center justify-center border ${isActive ? 'bg-indigo-950 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-neutral-900 border-neutral-800 text-neutral-700 opacity-25 blur-[0.2px] line-through'}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* B. Ergonomic Damage Injector Keypad */}
        <div className="grid grid-cols-4 gap-2 w-full mt-3">
          <button onClick={() => adjustHp(-10)} className="h-14 rounded-xl font-black text-xl bg-neutral-800 text-neutral-300 active:scale-95 transition-transform flex items-center justify-center border border-neutral-700">
            -10
          </button>
          <button onClick={() => adjustHp(10)} className="h-14 rounded-xl font-black text-xl bg-emerald-950 text-emerald-400 border border-emerald-800 active:scale-95 transition-transform shadow-[0_0_10px_rgba(5,150,105,0.1)] flex items-center justify-center">
            +10
          </button>
          <button onClick={() => adjustHp(50)} className="h-14 rounded-xl font-black text-xl bg-emerald-950 text-emerald-400 border border-emerald-800 active:scale-95 transition-transform shadow-[0_0_10px_rgba(5,150,105,0.1)] flex items-center justify-center">
            +50
          </button>
          <button onClick={() => adjustHp(100)} className="h-14 rounded-xl font-black text-xl bg-emerald-950 text-emerald-400 border border-emerald-800 active:scale-95 transition-transform shadow-[0_0_10px_rgba(5,150,105,0.1)] flex items-center justify-center">
            +100
          </button>
        </div>

        {/* C. Neon Special Condition Status Bar */}
        <div className="grid grid-cols-5 gap-1 w-full mt-3">
          <button 
            onClick={() => updatePlayer(player, { poisoned: !state.poisoned })} 
            className={`h-9 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center transition-all border ${state.poisoned ? 'shadow-[0_0_20px_rgba(34,197,94,0.6)] border-green-500 bg-green-950/40 text-green-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}
          >
            Poison
          </button>
          <button 
            onClick={() => updatePlayer(player, { burned: !state.burned })} 
            className={`h-9 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center transition-all border ${state.burned ? 'shadow-[0_0_20px_rgba(249,115,22,0.6)] border-orange-500 bg-orange-950/40 text-orange-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}
          >
            Burn
          </button>
          <button 
            onClick={() => updatePlayer(player, { asleep: !state.asleep })} 
            className={`h-9 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center transition-all border ${state.asleep ? 'shadow-[0_0_20px_rgba(59,130,246,0.6)] border-blue-500 bg-blue-950/40 text-blue-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}
          >
            Asleep
          </button>
          <button 
            onClick={() => updatePlayer(player, { paralyzed: !state.paralyzed })} 
            className={`h-9 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center transition-all border ${state.paralyzed ? 'shadow-[0_0_20px_rgba(234,179,8,0.6)] border-yellow-500 bg-yellow-950/40 text-yellow-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}
          >
            Para
          </button>
          <button 
            onClick={() => updatePlayer(player, { confused: !state.confused })} 
            className={`h-9 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center transition-all border ${state.confused ? 'shadow-[0_0_20px_rgba(168,85,247,0.6)] border-purple-500 bg-purple-950/40 text-purple-400' : 'border-neutral-800 bg-neutral-900 text-neutral-600'}`}
          >
            Confuse
          </button>
        </div>

        {/* D. Mechanical Legacy Markers (VSTAR / GX / ABILITY) */}
        <div className="flex items-center gap-2 w-full mt-3">
          <button 
            onClick={() => updatePlayer(player, { vstarUsed: !state.vstarUsed })}
            className={`flex-1 h-10 rounded-lg font-black italic tracking-widest text-sm border-2 transition-all flex items-center justify-center ${state.vstarUsed ? 'grayscale contrast-50 opacity-30 blur-[0.5px] border-neutral-700 bg-neutral-800 text-neutral-500' : 'bg-gradient-to-br from-yellow-200 to-yellow-600 text-neutral-950 border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.5)]'}`}
          >
            VSTAR
          </button>
          <button 
            onClick={() => updatePlayer(player, { gxUsed: !state.gxUsed })}
            className={`flex-1 h-10 rounded-lg font-black italic tracking-widest text-sm border-2 transition-all flex items-center justify-center ${state.gxUsed ? 'grayscale contrast-50 opacity-30 blur-[0.5px] border-neutral-700 bg-neutral-800 text-neutral-500' : 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`}
          >
            GX
          </button>
          <button 
            onClick={() => updatePlayer(player, { abilityUsed: !state.abilityUsed })}
            className={`flex-1 h-10 rounded-lg font-bold tracking-wider border transition-all flex flex-col items-center justify-center ${state.abilityUsed ? 'grayscale contrast-50 opacity-30 blur-[0.5px] border-neutral-700 bg-neutral-800 text-neutral-500' : 'bg-rose-950 text-rose-400 border-rose-800 shadow-[0_0_10px_rgba(225,29,72,0.3)]'}`}
          >
            <span className="text-[7px] leading-tight opacity-70">1/TURN</span>
            <span className="text-[10px] leading-tight">ABILITY</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black w-full h-screen max-w-md mx-auto flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* P2 Area */}
      <PlayerArea state={p2} player="p2" historyLen={historyP2.length} isRotated={true} />

      {/* Central Command Console */}
      <div className="h-[110px] w-full flex flex-col justify-between items-center py-2 bg-neutral-950/90 backdrop-blur border-y border-neutral-900 shadow-2xl relative z-50">
        
        {/* Match Timer & Coin Flipper Controls */}
        <div className="flex items-center justify-between w-full px-4 h-full">
          <div className="flex flex-col items-center justify-center w-1/3">
            <button 
              onClick={() => {
                fireFeedback();
                setIsTimerRunning(!isTimerRunning);
              }}
              className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 hover:text-white mb-1 active:scale-95"
            >
              {isTimerRunning ? 'Pause ⏸' : 'Start ▶'}
            </button>
            <span className="text-2xl font-mono tracking-widest font-extrabold text-amber-400" style={{ textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
              {formatTime(timeLeft)}
            </span>
            <button 
              onClick={() => {
                fireFeedback();
                setTimeLeft(1800);
                setIsTimerRunning(false);
                setP1(initialPlayerState());
                setP2(initialPlayerState());
                setHistoryP1([]);
                setHistoryP2([]);
              }}
              className="text-[9px] font-bold tracking-widest uppercase text-red-500 hover:text-red-400 mt-1 active:scale-95"
            >
              Reset All
            </button>
          </div>

          <div className="flex flex-col items-center justify-center w-2/3 h-full px-2">
            <button 
              onClick={flipCoin}
              className={`w-full py-2 rounded-lg font-black text-sm tracking-widest border-2 flex items-center justify-center transition-all ${isFlipping ? 'scale-95 opacity-80 border-neutral-600 bg-neutral-800 animate-pulse text-neutral-400' : coinResult === 'HEADS' ? 'border-cyan-500 bg-cyan-950 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : coinResult === 'TAILS' ? 'border-fuchsia-500 bg-fuchsia-950 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'border-neutral-700 bg-neutral-900 text-neutral-300'}`}
            >
              {isFlipping ? 'FLIPPING...' : coinResult === 'HEADS' ? 'HEADS (正面)' : coinResult === 'TAILS' ? 'TAILS (反面)' : 'FLIP COIN'}
            </button>
          </div>
        </div>

        {/* Monetization Core Component (Strict zero-CLS container) */}
        <div className="min-w-[320px] min-h-[50px] overflow-hidden bg-neutral-950 border border-dashed border-neutral-700/50 flex items-center justify-center rounded shrink-0">
          <span className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">
            Google AdSense Banner Container
          </span>
        </div>
      </div>

      {/* P1 Area */}
      <PlayerArea state={p1} player="p1" historyLen={historyP1.length} isRotated={false} />
      
    </div>
  );
}
