'use client';

import { FaceResult } from '@/lib/mlSidecar';

const EMOTION_COLORS: Record<string, string> = {
  happy:     'bg-green-500',
  sad:       'bg-blue-400',
  angry:     'bg-red-500',
  surprised: 'bg-yellow-400',
  fear:      'bg-purple-500',
  disgust:   'bg-orange-500',
  neutral:   'bg-slate-400',
};

function stressBarColor(score: number): string {
  if (score < 4) return 'bg-green-500';
  if (score < 7) return 'bg-amber-500';
  return 'bg-red-500';
}

interface StressHUDProps {
  frame: FaceResult | null;
}

export function StressHUD({ frame }: StressHUDProps) {
  if (!frame || !frame.face_detected) return null;

  const { stress_score, dominant, gaze, engagement, attention } = frame;
  const stressPct = Math.min(100, (stress_score / 10) * 100);
  const onScreen = gaze.looking_at_screen;
  const emotionColor = EMOTION_COLORS[dominant] ?? 'bg-slate-500';

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 items-end pointer-events-none select-none">

      {/* Gaze indicator */}
      <div
        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm
          ${onScreen ? 'bg-green-600/85 text-white' : 'bg-red-600/85 text-white'}`}
      >
        {onScreen ? '👁 on screen' : '👁 looking away'}
      </div>

      {/* Dominant emotion */}
      <div
        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm backdrop-blur-md ${emotionColor}/80`}
      >
        {dominant.toUpperCase()}
      </div>

      {/* Stress + engagement mini-panel */}
      <div className="bg-black/45 backdrop-blur-md rounded-xl px-3 py-2 flex flex-col gap-1.5 min-w-[140px] shadow-lg">
        {/* Stress row */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[10px] w-16 shrink-0">STRESS</span>
          <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${stressBarColor(stress_score)}`}
              style={{ width: `${stressPct}%` }}
            />
          </div>
          <span className="text-white text-[10px] font-bold w-5 text-right">{stress_score.toFixed(1)}</span>
        </div>

        {/* Engagement row */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[10px] w-16 shrink-0">ENGAGE</span>
          <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-400 transition-all duration-500"
              style={{ width: `${Math.round(engagement * 100)}%` }}
            />
          </div>
          <span className="text-white/80 text-[10px] w-5 text-right">{Math.round(engagement * 100)}</span>
        </div>

        {/* Attention row */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[10px] w-16 shrink-0">ATTENTION</span>
          <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${Math.round(attention * 100)}%` }}
            />
          </div>
          <span className="text-white/80 text-[10px] w-5 text-right">{Math.round(attention * 100)}</span>
        </div>
      </div>
    </div>
  );
}
