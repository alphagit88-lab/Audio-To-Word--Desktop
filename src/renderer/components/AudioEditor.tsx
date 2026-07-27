import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { AudioFileInfo } from '../../types';
import { useTranslation } from '../context/LanguageContext';

interface AudioEditorProps {
  file: AudioFileInfo;
  onUpdate: (updates: Partial<AudioFileInfo>) => void;
  disabled?: boolean;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [
    h,
    m > 9 ? m : h ? '0' + m : m || '0',
    s > 9 ? s : '0' + s,
  ]
    .filter(a => a)
    .join(':');
};

const timeToSeconds = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

const secondsToTime = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const AudioEditor: React.FC<AudioEditorProps> = ({ file, onUpdate, disabled }) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const startSec = file.startTime ? timeToSeconds(file.startTime) : 0;
  const endSec = file.endTime ? timeToSeconds(file.endTime) : duration;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // Optional: Auto-pause if we hit the end bound
      if (endSec > 0 && audioRef.current.currentTime >= endSec && isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = startSec;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (!file.endTime) {
        onUpdate({ endTime: secondsToTime(audioRef.current.duration) });
      }
    }
  };

  const setStartToCurrent = () => {
    if (disabled) return;
    if (currentTime < endSec || endSec === 0) {
      onUpdate({ startTime: secondsToTime(currentTime) });
    }
  };

  const setEndToCurrent = () => {
    if (disabled) return;
    if (currentTime > startSec) {
      onUpdate({ endTime: secondsToTime(currentTime) });
    }
  };

  // Dragging logic
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | 'playhead' | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeHandle || !trackRef.current || duration === 0) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      let newPercent = (e.clientX - rect.left) / rect.width;
      newPercent = Math.max(0, Math.min(1, newPercent));
      
      const newTime = newPercent * duration;

      if (activeHandle === 'playhead') {
        if (audioRef.current) audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      } else if (activeHandle === 'start') {
        const validTime = Math.min(newTime, endSec - 1);
        onUpdate({ startTime: secondsToTime(Math.max(0, validTime)) });
      } else if (activeHandle === 'end') {
        const validTime = Math.max(newTime, startSec + 1);
        onUpdate({ endTime: secondsToTime(Math.min(duration, validTime)) });
      }
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
    };

    if (activeHandle) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeHandle, duration, startSec, endSec, onUpdate]);

  const startPercent = duration > 0 ? (startSec / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endSec / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', width: '100%', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <audio 
        ref={audioRef}
        src={`file:///${file.filePath.replace(/\\/g, '/')}`} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }} 
      />

      {/* Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={togglePlay}
          style={{ background: '#6366f1', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', opacity: disabled ? 0.5 : 1 }}>
          <button disabled={disabled} onClick={setStartToCurrent} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeftToLine size={14} /> {t('editor.set_start')}
          </button>
          <button disabled={disabled} onClick={setEndToCurrent} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {t('editor.set_end')} <ArrowRightToLine size={14} />
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Interactive Track */}
      <div style={{ padding: '10px 0', marginTop: '0.5rem', opacity: disabled ? 0.6 : 1 }}>
        <div 
          ref={trackRef}
          onPointerDown={(e) => {
            if (disabled) return;
            if (!trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const newPercent = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) audioRef.current.currentTime = newPercent * duration;
            setActiveHandle('playhead');
          }}
          style={{ position: 'relative', width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {/* Selected Range Highlight */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${startPercent}%`, right: `${100 - endPercent}%`, background: 'rgba(99, 102, 241, 0.3)' }} />
          
          {/* Playhead */}
          <div style={{ position: 'absolute', top: '-4px', bottom: '-4px', left: `${currentPercent}%`, width: '2px', background: '#fff', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10 }} />

          {/* Start Handle */}
          <div 
            onPointerDown={(e) => { e.stopPropagation(); if (!disabled) setActiveHandle('start'); }}
            style={{ position: 'absolute', top: '-6px', left: `${startPercent}%`, width: '12px', height: '20px', background: '#34d399', borderRadius: '4px', transform: 'translateX(-50%)', cursor: disabled ? 'not-allowed' : 'ew-resize', zIndex: 20, boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}
          />

          {/* End Handle */}
          <div 
            onPointerDown={(e) => { e.stopPropagation(); if (!disabled) setActiveHandle('end'); }}
            style={{ position: 'absolute', top: '-6px', left: `${endPercent}%`, width: '12px', height: '20px', background: '#ef4444', borderRadius: '4px', transform: 'translateX(-50%)', cursor: disabled ? 'not-allowed' : 'ew-resize', zIndex: 20, boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}
          />
        </div>
      </div>

      {/* Manual Time Inputs */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem', opacity: disabled ? 0.5 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('editor.label_start')}</span>
          <input
            type="text"
            disabled={disabled}
            placeholder="00:00:00"
            value={file.startTime || '00:00:00'}
            onChange={(e) => onUpdate({ startTime: e.target.value })}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: '80px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', cursor: disabled ? 'not-allowed' : 'text' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('editor.label_end')}</span>
          <input
            type="text"
            disabled={disabled}
            placeholder="00:00:00"
            value={file.endTime || secondsToTime(duration)}
            onChange={(e) => onUpdate({ endTime: e.target.value })}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ef4444', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: '80px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', cursor: disabled ? 'not-allowed' : 'text' }}
          />
        </div>
      </div>
    </div>
  );
};
