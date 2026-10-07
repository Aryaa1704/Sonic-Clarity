import React, { useEffect, useRef, useState } from 'react';
import { Activity, BarChart2, Radio } from 'lucide-react';

interface AudioVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  statusLabel?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  isSpeaking,
  statusLabel = 'Listening...',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'fluid' | 'bars'>('fluid');
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;

    const render = () => {
      step += 0.04;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Gradient from Electric Cyan (#38BDF8) to Royal Cobalt (#2563EB)
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#38BDF8');
      gradient.addColorStop(0.5, '#2563EB');
      gradient.addColorStop(1, '#38BDF8');

      const isLive = isActive || isSpeaking;
      const baseAmplitude = isLive ? (isSpeaking ? 34 : 26) : 8;

      if (visualMode === 'fluid') {
        // Multi-layer continuous wave
        const layers = [
          { speed: 1.2, alpha: 0.85, ampMod: 1.0, freq: 0.015 },
          { speed: 0.8, alpha: 0.45, ampMod: 0.7, freq: 0.02 },
          { speed: 1.6, alpha: 0.25, ampMod: 0.5, freq: 0.01 }
        ];

        layers.forEach((layer) => {
          ctx.beginPath();
          ctx.moveTo(0, centerY);

          for (let x = 0; x < width; x++) {
            // Apply a nice bell curve window so wave tapers off at edges
            const normalizedX = x / width;
            const envelope = Math.sin(normalizedX * Math.PI);
            const dynamicAmp = baseAmplitude * envelope * layer.ampMod;
            
            // Multiple sine frequency harmonics
            const y = centerY + Math.sin(x * layer.freq + step * layer.speed) * dynamicAmp
                            + Math.cos(x * 0.03 - step * 0.5) * (dynamicAmp * 0.35);
            ctx.lineTo(x, y);
          }

          ctx.strokeStyle = gradient;
          ctx.lineWidth = layer.ampMod === 1.0 ? 3 : 1.5;
          ctx.globalAlpha = layer.alpha;
          ctx.stroke();
        });

        // Soft center glow when speaking/active
        if (isLive) {
          const glowGrad = ctx.createRadialGradient(width / 2, centerY, 5, width / 2, centerY, 80);
          glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
          glowGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(0, 0, width, height);
        }

      } else {
        // Frequency Bar Spectrum
        const barCount = 48;
        const barWidth = (width / barCount) - 3;
        ctx.fillStyle = gradient;

        for (let i = 0; i < barCount; i++) {
          const normalized = i / barCount;
          const distFromCenter = Math.abs(normalized - 0.5) * 2;
          const envelope = 1 - distFromCenter * 0.6;
          
          const noise = Math.sin(i * 0.4 + step * 2) * 0.5 + 0.5;
          const barHeight = Math.max(4, baseAmplitude * 1.8 * envelope * noise);
          
          const x = i * (barWidth + 3);
          const y = centerY - barHeight / 2;

          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 2, 2]);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isActive, isSpeaking, visualMode]);

  return (
    <div className="relative w-full rounded-2xl bg-white border border-[#e2e8f0] p-4 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] overflow-hidden">
      {/* Top status indicator row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive
                ? 'bg-[#38bdf8] animate-ping'
                : isSpeaking
                ? 'bg-[#2563eb] animate-pulse'
                : 'bg-[#94a3b8]'
            }`}
          />
          <span className="text-xs font-semibold tracking-wide uppercase text-[#0f2942]">
            {isActive ? 'Listening (Deepgram STT)' : isSpeaking ? 'Synthesizing (ElevenLabs)' : 'Acoustic Standby'}
          </span>
          <span className="text-xs text-[#64748b] hidden sm:inline">
            {isActive || isSpeaking ? '• Streaming 24kHz Audio' : '• Ready for input'}
          </span>
        </div>

        {/* Visualizer Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
          <button
            onClick={() => setVisualMode('fluid')}
            className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
              visualMode === 'fluid'
                ? 'bg-white text-[#2563eb] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f2942]'
            }`}
            title="Continuous Fluid Wave"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fluid Wave</span>
          </button>
          <button
            onClick={() => setVisualMode('bars')}
            className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
              visualMode === 'bars'
                ? 'bg-white text-[#2563eb] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f2942]'
            }`}
            title="Frequency Spectrum Bars"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Spectrum</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-24 sm:h-28 bg-[#f8f9ff] rounded-xl flex items-center justify-center border border-[#e2e8f0]/60 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={720}
          height={112}
          className="w-full h-full block"
        />

        {/* Status indicator when live */}
        {(isActive || isSpeaking) && (
          <div className="absolute bottom-2 right-3 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-xs border border-[#38bdf8]/30 text-[10px] text-[#0f2942] font-semibold">
            <Radio className="w-3 h-3 text-[#38bdf8] animate-pulse" />
            <span>{isSpeaking ? 'AI Voice Active' : 'Voice Input Active'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
