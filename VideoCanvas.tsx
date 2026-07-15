import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { FontType, BackgroundType, ColorType, AnimationType, Quote, MusicType } from '../types';
import { playProceduralMusic, stopProceduralMusic } from '../utils/audioSynth';

interface VideoCanvasProps {
  daysLeft: number;
  quote: Quote;
  font: FontType;
  background: BackgroundType;
  music: MusicType;
  color: ColorType;
  animation: AnimationType;
  volume: number;
  isPlaying: boolean;
  onMusicStateChange?: (isPlaying: boolean) => void;
}

export interface VideoCanvasRef {
  generateVideo: (onProgress: (progress: number) => void) => Promise<Blob>;
}

// Map Font types to actual CSS font-families loaded in index.css
const FONT_MAP: Record<FontType, string> = {
  'inter': '"Inter", sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  'playfair-display': '"Playfair Display", serif',
  'cinzel': '"Cinzel", serif',
  'jetbrains-mono': '"JetBrains Mono", monospace',
  'fredoka': '"Fredoka", sans-serif',
};

// Map color choices to Hex colors for typography
const COLOR_MAP: Record<ColorType, { text: string; glow: string; accent: string }> = {
  'white': { text: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.4)', accent: '#E5E5E5' },
  'gold': { text: '#FBBF24', glow: 'rgba(251, 191, 36, 0.5)', accent: '#F59E0B' },
  'cyan': { text: '#22D3EE', glow: 'rgba(34, 211, 238, 0.5)', accent: '#06B6D4' },
  'rose': { text: '#F43F5E', glow: 'rgba(244, 63, 94, 0.5)', accent: '#E11D48' },
  'emerald': { text: '#10B981', glow: 'rgba(16, 185, 129, 0.5)', accent: '#059669' },
};

export const VideoCanvas = forwardRef<VideoCanvasRef, VideoCanvasProps>(({
  daysLeft,
  quote,
  font,
  background,
  music,
  color,
  animation,
  volume,
  isPlaying,
  onMusicStateChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStopRef = useRef<(() => void) | null>(null);
  const audioDestNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Particle systems or grid offset states
  const particles = useRef<any[]>([]);
  const gridOffset = useRef<number>(0);
  const auroraOffset = useRef<number>(0);
  const matrixStreams = useRef<any[]>([]);
  const startTime = useRef<number>(Date.now());

  // Initialize particles once based on background selection
  const initParticles = (type: BackgroundType, w: number, h: number) => {
    particles.current = [];
    if (type === 'nebula') {
      for (let i = 0; i < 150; i++) {
        particles.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1,
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.5 + 0.1,
          distance: Math.random() * Math.min(w, h) * 0.7,
          color: `hsl(${260 + Math.random() * 60}, 80%, ${70 + Math.random() * 20}%)`,
        });
      }
    } else if (type === 'confetti') {
      for (let i = 0; i < 120; i++) {
        particles.current.push({
          x: Math.random() * w,
          y: Math.random() * h - h,
          size: Math.random() * 8 + 4,
          speedY: Math.random() * 2 + 1,
          speedX: Math.random() * 1 - 0.5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.05 - 0.025,
          color: `hsl(${Math.random() * 360}, 90%, 65%)`,
        });
      }
    } else if (type === 'matrix') {
      const columns = Math.floor(w / 16);
      matrixStreams.current = [];
      for (let i = 0; i < columns; i++) {
        matrixStreams.current.push({
          x: i * 16 + 8,
          y: Math.random() * -h,
          speed: Math.random() * 3 + 2,
          chars: Array.from({ length: 15 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 93))),
        });
      }
    }
  };

  // Start Audio Context on user action
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Synchronize dynamic background music track playing
  useEffect(() => {
    if (isPlaying && music !== 'none') {
      try {
        initAudio();
        if (audioContextRef.current) {
          const { stop, destinationNode } = playProceduralMusic(music, audioContextRef.current, volume);
          audioStopRef.current = stop;
          audioDestNodeRef.current = destinationNode;
        }
      } catch (err) {
        console.error("Audio Synthesis error: ", err);
      }
    } else {
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }
    }

    return () => {
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }
    };
  }, [music, isPlaying, volume]);

  // Main Canvas Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set logical rendering dimensions (540x960 is excellent responsive resolution)
    const w = 540;
    const h = 960;
    canvas.width = w;
    canvas.height = h;

    initParticles(background, w, h);
    startTime.current = Date.now();

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTime.current) / 1000; // in seconds

      ctx.clearRect(0, 0, w, h);

      // --- 1. RENDER BACKGROUND ANIMATIONS ---
      if (background === 'nebula') {
        // Space gradient
        const bgGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, Math.max(w, h));
        bgGrad.addColorStop(0, '#1E1B4B'); // Indigo-950
        bgGrad.addColorStop(0.5, '#0F0E26');
        bgGrad.addColorStop(1, '#020205');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw swirling cosmic dust clusters
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const nebulaGrad = ctx.createRadialGradient(
          w/2 + Math.cos(elapsed * 0.2) * 80, 
          h/2 + Math.sin(elapsed * 0.1) * 80, 
          10, 
          w/2, h/2, 280
        );
        nebulaGrad.addColorStop(0, 'rgba(139, 92, 246, 0.15)'); // Violet-500
        nebulaGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.08)'); // Pink-500
        nebulaGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, w, h);

        // Orbiting Star Particles
        particles.current.forEach(p => {
          p.angle += p.speed * 0.01;
          const px = w/2 + Math.cos(p.angle) * p.distance;
          const py = h/2 + Math.sin(p.angle) * p.distance * 0.8;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
        ctx.restore();

      } else if (background === 'retrowave') {
        // Retro gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#02000A');
        bgGrad.addColorStop(0.5, '#1B053A'); // Dark Purple
        bgGrad.addColorStop(1, '#3B0764'); // Purple-950
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const horizonY = h * 0.45;

        // Draw Synthwave Sunset grid-sun in center
        ctx.save();
        const sunRadius = 110;
        const sunX = w / 2;
        const sunY = horizonY - 15;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
        sunGrad.addColorStop(0, '#F43F5E'); // Rose-500
        sunGrad.addColorStop(0.4, '#FBBF24'); // Yellow-400
        sunGrad.addColorStop(1, '#EC4899'); // Pink-500
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, Math.PI, 0, false);
        ctx.fill();

        // Slice lines into the sunset
        ctx.fillStyle = '#1B053A';
        for (let sy = sunY - sunRadius; sy < sunY; sy += 10) {
          const sliceHeight = Math.max(1, (sy - (sunY - sunRadius)) / 14);
          ctx.fillRect(sunX - sunRadius - 10, sy, sunRadius * 2 + 20, sliceHeight);
        }
        ctx.restore();

        // 3D Perspective Grid
        ctx.save();
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)'; // Neon pink grid line
        ctx.lineWidth = 1.5;

        gridOffset.current += 1.8; // Grid scrolling speed
        if (gridOffset.current >= 40) gridOffset.current = 0;

        // Converging perspective lines from horizon
        const linesCount = 14;
        for (let i = 0; i <= linesCount; i++) {
          const xPercent = i / linesCount;
          const targetX = w * -0.5 + xPercent * w * 2;
          ctx.beginPath();
          ctx.moveTo(w / 2, horizonY);
          ctx.lineTo(targetX, h);
          ctx.stroke();
        }

        // Horizontal lines scrolling down with perspective spacing
        for (let y = horizonY; y < h; y += 30) {
          // Perspective spacing factor
          const progress = (y - horizonY) / (h - horizonY);
          const drawY = horizonY + progress * (h - horizonY) + gridOffset.current * progress;
          if (drawY > horizonY && drawY < h) {
            ctx.beginPath();
            ctx.moveTo(0, drawY);
            ctx.lineTo(w, drawY);
            ctx.stroke();
          }
        }
        ctx.restore();

      } else if (background === 'aurora') {
        // Deep sky night gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#050B14');
        bgGrad.addColorStop(0.7, '#07162C');
        bgGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Twinkling stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 40; i++) {
          const starX = (Math.sin(i * 999) * 0.5 + 0.5) * w;
          const starY = (Math.cos(i * 123) * 0.5 + 0.5) * (h * 0.5);
          const size = Math.abs(Math.sin(elapsed * 2 + i)) * 1.5 + 0.5;
          ctx.fillRect(starX, starY, size, size);
        }

        // Animated wavy Aurora ribbons
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        auroraOffset.current += 0.004;

        const drawAuroraRibbon = (offsetMultiplier: number, baseColor: string, heightShift: number) => {
          ctx.beginPath();
          ctx.moveTo(0, h * 0.6);
          
          for (let x = 0; x <= w; x += 10) {
            const waveY = h * heightShift + 
              Math.sin(x * 0.015 + elapsed * 0.4 + offsetMultiplier) * 40 +
              Math.cos(x * 0.008 - elapsed * 0.2) * 20;
            ctx.lineTo(x, waveY);
          }
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();

          const auroraGrad = ctx.createLinearGradient(0, h * 0.3, 0, h);
          auroraGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          auroraGrad.addColorStop(0.4, baseColor);
          auroraGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = auroraGrad;
          ctx.fill();
        };

        // Draw overlapping color bands
        drawAuroraRibbon(0, 'rgba(16, 185, 129, 0.15)', 0.42); // Emerald Green
        drawAuroraRibbon(2.5, 'rgba(6, 182, 212, 0.12)', 0.45); // Turquoise Cyan
        drawAuroraRibbon(5.1, 'rgba(139, 92, 246, 0.1)', 0.39); // Purple
        ctx.restore();

      } else if (background === 'confetti') {
        // Deep rich luxury dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0D050E');
        bgGrad.addColorStop(0.6, '#1E0E21');
        bgGrad.addColorStop(1, '#050206');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Falling gold stars & specks
        particles.current.forEach(p => {
          p.y += p.speedY;
          p.x += Math.sin(elapsed + p.y * 0.01) * p.speedX;
          p.rotation += p.rotSpeed;

          if (p.y > h + 10) {
            p.y = -20;
            p.x = Math.random() * w;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;

          // Draw square confetti bits or tiny circles
          ctx.beginPath();
          if (p.size > 8) {
            ctx.rect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
          } else {
            ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.restore();
        });

      } else if (background === 'matrix') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'; // Matrix dark trailing fade
        ctx.fillRect(0, 0, w, h);

        ctx.font = '14px monospace';
        matrixStreams.current.forEach(stream => {
          stream.y += stream.speed;
          if (stream.y > h + 50) {
            stream.y = Math.random() * -150 - 50;
            stream.speed = Math.random() * 3 + 2;
          }

          // Render streaming characters down
          stream.chars.forEach((char: string, idx: number) => {
            const charY = stream.y - (idx * 18);
            if (charY > 0 && charY < h) {
              const alpha = 1 - (idx / stream.chars.length);
              
              // Head is pure glowing white-green, body is green
              if (idx === 0) {
                ctx.fillStyle = `rgba(230, 255, 230, ${alpha})`;
              } else {
                ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`; // Green-500
              }

              // Randomize characters dynamically for raw code matrix aesthetic
              if (Math.random() > 0.95) {
                stream.chars[idx] = String.fromCharCode(33 + Math.floor(Math.random() * 93));
              }

              ctx.fillText(char, stream.x, charY);
            }
          });
        });
      }

      // --- 2. RENDER OVERLAY / GRID BORDER VIBE ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // --- 3. APPLY SMOOTH TEXT ANIMATIONS / SCALE COEFFICIENTS ---
      let fontScale = 1;
      let textAlpha = 1;
      let slideYOffset = 0;

      if (animation === 'zoom') {
        // Gentle cinematic breathing scale
        fontScale = 1 + Math.sin(elapsed * 1.5) * 0.03;
      } else if (animation === 'fade') {
        // Slow emotional rhythmic fade wave
        textAlpha = 0.85 + Math.sin(elapsed * 2) * 0.15;
      } else if (animation === 'slide') {
        // Gentle smooth hover oscillation
        slideYOffset = Math.sin(elapsed * 1.2) * 8;
      } else if (animation === 'pulsate') {
        // Dynamic rhythmic heartbeat scale pulse
        fontScale = 1 + Math.abs(Math.sin(elapsed * 3.14)) * 0.04;
      }

      const activeColor = COLOR_MAP[color];

      // --- 4. DRAW CENTRAL COUNTDOWN TYPOGRAPHY ---
      ctx.save();
      ctx.translate(w / 2, h * 0.38 + slideYOffset);
      ctx.scale(fontScale, fontScale);

      // Subtitle top label
      ctx.textAlign = 'center';
      ctx.font = `600 13px ${FONT_MAP[font]}`;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * textAlpha})`;
      ctx.letterSpacing = '6px';
      ctx.fillText('COUNTDOWN TO NEW YEAR', 0, -110);
      ctx.letterSpacing = '0px';

      // Big primary header "ONLY"
      ctx.font = `800 32px ${FONT_MAP[font]}`;
      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha * 0.9})`;
      ctx.letterSpacing = '3px';
      ctx.fillText('ONLY', 0, -60);
      ctx.letterSpacing = '0px';

      // Giant Glowing Days Count "XXX"
      ctx.font = `900 105px ${FONT_MAP[font]}`;
      ctx.fillStyle = activeColor.text;
      
      // Dynamic Drop Shadow/Glow effect
      ctx.shadowColor = activeColor.glow;
      ctx.shadowBlur = 25;
      ctx.fillText(String(daysLeft), 0, 40);
      
      // Reset Shadow
      ctx.shadowBlur = 0;

      // "DAYS LEFT"
      ctx.font = `800 36px ${FONT_MAP[font]}`;
      ctx.fillStyle = activeColor.accent;
      ctx.letterSpacing = '2px';
      ctx.fillText('DAYS LEFT', 0, 110);
      ctx.letterSpacing = '0px';

      ctx.restore();

      // --- 5. DRAW MOTIVATIONAL QUOTE AT BOTTOM AREA ---
      ctx.save();
      ctx.translate(w / 2, h * 0.74);

      // Draw light horizontal divider line
      ctx.beginPath();
      ctx.moveTo(-w * 0.25, 0);
      ctx.lineTo(w * 0.25, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Wrap & render beautiful quote text block
      ctx.font = `italic 500 18px ${FONT_MAP[font]}`;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * textAlpha})`;
      ctx.textAlign = 'center';

      const wrapText = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      const quoteLines = wrapText(`“${quote.text}”`, w * 0.8);
      let textY = 40;
      quoteLines.forEach(line => {
        ctx.fillText(line, 0, textY);
        textY += 26;
      });

      // Render author name
      ctx.font = `600 13px ${FONT_MAP[font]}`;
      ctx.fillStyle = activeColor.text;
      ctx.letterSpacing = '2px';
      ctx.fillText(`- ${quote.author.toUpperCase()}`, 0, textY + 18);
      ctx.letterSpacing = '0px';

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [daysLeft, quote, font, background, color, animation]);

  // Expose standard high-performance video generation/recording capabilities
  useImperativeHandle(ref, () => ({
    generateVideo: async (onProgress: (progress: number) => void): Promise<Blob> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas is not ready");

      // Stop normal playback music if playing
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }

      // Initialize dedicated high-quality generation Audio Context
      const exportAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const { stop: stopExportMusic, destinationNode } = playProceduralMusic(music, exportAudioCtx, volume);
      
      onProgress(5); // Started

      // Capture canvas at 30 fps
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();

      // Gather video track
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

      // Gather synthesized procedural music audio track
      if (music !== 'none' && destinationNode) {
        destinationNode.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      }

      // Determine best browser supported video encoding
      let options = { mimeType: 'video/webm' };
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        options = { mimeType: 'video/webm;codecs=vp9,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
        options = { mimeType: 'video/mp4;codecs=h264,aac' };
      }

      const recorder = new MediaRecorder(combinedStream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          stopExportMusic();
          exportAudioCtx.close();
          const videoBlob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
          resolve(videoBlob);
        };

        recorder.onerror = (err) => {
          stopExportMusic();
          exportAudioCtx.close();
          reject(err);
        };

        // Start recording
        recorder.start();

        // Count down exactly 15 seconds in increments to update progression
        let count = 0;
        const totalDuration = 15; // 15 seconds
        const step = 0.5; // half second intervals

        const interval = window.setInterval(() => {
          count += step;
          const percent = Math.min(95, Math.floor((count / totalDuration) * 100));
          onProgress(percent);

          if (count >= totalDuration) {
            clearInterval(interval);
            onProgress(100);
            try {
              recorder.stop();
            } catch (err) {
              reject(err);
            }
          }
        }, step * 1000);
      });
    }
  }));

  return (
    <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black border border-neutral-800 m3-glow-purple">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover rounded-2xl block"
      />
      {/* Visual Overlay indication if muted */}
      {music !== 'none' && !isPlaying && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-neutral-400 font-mono tracking-wider border border-neutral-800 pointer-events-none">
          🔈 TAP PREVIEW TO HEAR MUSIC
        </div>
      )}
    </div>
  );
});

VideoCanvas.displayName = 'VideoCanvas';
