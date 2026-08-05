import React, { useState, useRef, useEffect } from 'react';
import { TranscriptionPart } from '../../types';
import {
  X, RotateCcw, CheckCircle, Clock, FileText,
  Loader2, ChevronRight, Download, AlertCircle,
  Minimize2, Maximize2
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface Props {
  parts: TranscriptionPart[];
  totalChunks: number;
  apiKeys: string[];
  transcriptionModel: string;
  onClose: () => void;
  onPartUpdated: (chunkIndex: number, newText: string, newDocxPath?: string) => void;
  onFinalize: (parts: TranscriptionPart[]) => Promise<void>;
  isFinalizing: boolean;
  authToken: string | null;
}

export const TranscriptionReviewPanel: React.FC<Props> = ({
  parts,
  totalChunks,
  apiKeys,
  transcriptionModel,
  onClose,
  onPartUpdated,
  onFinalize,
  isFinalizing,
  authToken,
}) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmittedSet, setResubmittedSet] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [localModel, setLocalModel] = useState(transcriptionModel);
  const textRef = useRef<HTMLDivElement>(null);

  const selectedPart = parts.find((p) => p.chunkIndex === selectedIndex);

  // Scroll text area to top when part changes
  useEffect(() => {
    if (textRef.current) textRef.current.scrollTop = 0;
  }, [selectedIndex]);

  // Auto-select newest received part
  useEffect(() => {
    if (parts.length > 0 && !parts.find((p) => p.chunkIndex === selectedIndex)) {
      setSelectedIndex(parts[parts.length - 1].chunkIndex);
    }
  }, [parts]);

  const handleResubmit = async () => {
    if (!selectedPart || !prompt.trim() || isResubmitting) return;
    setIsResubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await window.electronAPI.resubmitChunk(
        selectedPart.chunkIndex,
        selectedPart.audioChunkPaths,
        prompt.trim(),
        apiKeys,
        localModel,
        selectedPart.primaryAudioFilePath,
        authToken ?? undefined,
        selectedPart.text
      );
      onPartUpdated(selectedPart.chunkIndex, result.text, result.docxPath);
      setResubmittedSet((prev) => new Set([...prev, selectedPart.chunkIndex]));
      setPrompt('');
      setSuccessMsg(`Part ${selectedPart.chunkIndex + 1} updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError('Resubmission failed. Please try again.');
    } finally {
      setIsResubmitting(false);
    }
  };

  const allDone = parts.length === totalChunks;

  const s = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 9999,
      background: 'rgba(7, 10, 20, 0.88)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    panel: {
      width: 'calc(100vw - 60px)',
      height: 'calc(100vh - 60px)',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column' as const,
      background: 'linear-gradient(145deg, #0f172a 0%, #1a2235 100%)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '18px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      overflow: 'hidden',
    },
    header: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(15,23,42,0.6)',
      flexShrink: 0 as const,
    },
    body: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    sidebar: {
      width: '220px',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto' as const,
      background: 'rgba(10,16,30,0.5)',
      flexShrink: 0 as const,
      padding: '0.75rem 0.5rem',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.25rem',
    },
    partBtn: (isActive: boolean, isDone: boolean, isResubmitted: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.65rem 0.75rem',
      borderRadius: '8px',
      border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
      background: isActive
        ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)'
        : 'none',
      color: isActive ? '#e2e8f0' : isDone ? '#94a3b8' : '#475569',
      fontSize: '0.82rem',
      fontWeight: isActive ? 600 : 500,
      cursor: isDone ? 'pointer' : 'default',
      transition: 'all 0.15s',
      width: '100%',
      textAlign: 'left' as const,
    }),
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    textArea: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '1.5rem',
      lineHeight: 1.8,
      fontSize: '0.9rem',
      color: '#cbd5e1',
      whiteSpace: 'pre-wrap' as const,
    },
    bottomBar: {
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '1rem 1.5rem',
      background: 'rgba(10,16,30,0.5)',
      flexShrink: 0 as const,
    },
    promptInput: {
      width: '100%',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: '#f1f5f9',
      padding: '0.7rem 1rem',
      fontSize: '0.85rem',
      resize: 'vertical' as const,
      minHeight: '64px',
      outline: 'none',
      fontFamily: 'inherit',
      marginBottom: '0.75rem',
      boxSizing: 'border-box' as const,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
    },
  };

  const getPartStatus = (idx: number) => {
    const done = parts.find((p) => p.chunkIndex === idx);
    if (!done) return 'pending';
    if (resubmittedSet.has(idx)) return 'resubmitted';
    return 'done';
  };

  const StatusIcon = ({ idx }: { idx: number }) => {
    const st = getPartStatus(idx);
    if (st === 'pending') return <Clock size={13} color="#475569" />;
    if (st === 'resubmitted') return <RotateCcw size={13} color="#f59e0b" />;
    return <CheckCircle size={13} color="#10b981" />;
  };

  if (isMinimized) {
    return (
      <div 
        style={{
          position: 'fixed' as const, bottom: '24px', right: '24px', zIndex: 9999,
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px',
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onClick={() => setIsMinimized(false)}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0, 0, 0, 0.6)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(99,102,241,0.15)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.25)' }}>
            <FileText size={20} color="#818cf8" />
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>Review Transcription</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
              {parts.length} of {totalChunks} parts transcribed
              {!allDone && (
                <span style={{ marginLeft: '6px', color: '#6366f1', display: 'flex', alignItems: 'center' }}>
                  <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
          style={{ 
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '6px', padding: '6px', color: '#e2e8f0', cursor: 'pointer', 
            display: 'flex', transition: 'background 0.2s' 
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={s.overlay}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '8px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Transcription Review
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                {parts.length} of {totalChunks} parts transcribed
                {!allDone && (
                  <span style={{ marginLeft: '0.5rem', color: '#6366f1' }}>
                    <Loader2 size={11} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> transcribing…
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button onClick={() => setIsMinimized(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: '0.4rem', borderRadius: '6px',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
              title="Minimize panel"
            >
              <Minimize2 size={18} />
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: '0.4rem', borderRadius: '6px',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
              title="Close panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.25rem 0.5rem' }}>
              Parts
            </div>
            {Array.from({ length: totalChunks }, (_, i) => {
              const isDone = !!parts.find((p) => p.chunkIndex === i);
              const isActive = selectedIndex === i;
              const isResubmitted = resubmittedSet.has(i);
              return (
                <button
                  key={i}
                  style={s.partBtn(isActive, isDone, isResubmitted)}
                  onClick={() => isDone && setSelectedIndex(i)}
                >
                  <StatusIcon idx={i} />
                  <span>Part {i + 1}</span>
                  {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div style={s.content}>
            {/* Part header */}
            <div style={{
              padding: '0.75rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(15,23,42,0.3)', flexShrink: 0
            }}>
              <span style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.9rem' }}>
                Part {selectedIndex + 1}
              </span>
              {resubmittedSet.has(selectedIndex) && (
                <span style={{
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600,
                  padding: '0.15rem 0.5rem', borderRadius: '20px'
                }}>
                  Resubmitted
                </span>
              )}
              {selectedPart?.docxPath && (
                <button
                  onClick={() => window.electronAPI.openFolder(selectedPart.docxPath!)}
                  style={{
                    marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px', color: '#64748b', cursor: 'pointer',
                    fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex',
                    alignItems: 'center', gap: '0.35rem', transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  title="Open part docx in folder"
                >
                  <Download size={12} /> Part {selectedIndex + 1}.docx
                </button>
              )}
            </div>

            {/* Scrollable text */}
            <div ref={textRef} style={s.textArea}>
              {selectedPart ? (
                selectedPart.text
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569', marginTop: '2rem' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Transcribing this part…
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div style={s.bottomBar}>
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '6px', padding: '0.5rem 0.75rem',
                  color: '#fca5a5', fontSize: '0.8rem', marginBottom: '0.75rem'
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {successMsg && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '6px', padding: '0.5rem 0.75rem',
                  color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '0.75rem'
                }}>
                  <CheckCircle size={14} /> {successMsg}
                </div>
              )}
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <textarea
                  style={{ ...s.promptInput, marginBottom: 0, paddingBottom: '2.8rem' }}
                  placeholder={`Correction prompt for Part ${selectedIndex + 1}… e.g. "Format as a dialog between two speakers"`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!selectedPart || isResubmitting}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleResubmit(); }}
                />
                <div style={{ position: 'absolute', bottom: '0.6rem', right: '0.6rem', zIndex: 10 }}>
                  <select
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    disabled={isResubmitting}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px', color: '#94a3b8', padding: '0.3rem 0.6rem', fontSize: '0.75rem', outline: 'none',
                      cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    <option style={{ background: '#0f172a' }} value="gemini-3.5-flash-lite">{t('options.transcribe_model_1')}</option>
                    <option style={{ background: '#0f172a' }} value="gemini-3.5-flash">{t('options.transcribe_model_2')}</option>
                  </select>
                </div>
              </div>
              <div style={s.row}>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleResubmit}
                    disabled={!selectedPart || !prompt.trim() || isResubmitting}
                    style={{
                      background: !selectedPart || !prompt.trim() || isResubmitting
                        ? 'rgba(99,102,241,0.2)'
                        : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      border: 'none', borderRadius: '8px', color: '#fff',
                      padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                      cursor: !selectedPart || !prompt.trim() || isResubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      opacity: !selectedPart || !prompt.trim() ? 0.5 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isResubmitting
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Resubmitting…</>
                      : <><RotateCcw size={14} /> Resubmit Part {selectedIndex + 1}</>
                    }
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.73rem', color: '#475569' }}>
                    {allDone ? 'All parts transcribed' : `Waiting for ${totalChunks - parts.length} more parts…`}
                  </span>
                  <button
                    onClick={() => onFinalize(parts)}
                    disabled={parts.length === 0 || isFinalizing}
                    style={{
                      background: parts.length === 0 || isFinalizing
                        ? 'rgba(16,185,129,0.15)'
                        : 'linear-gradient(135deg,#10b981,#059669)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: '8px', color: '#fff',
                      padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                      cursor: parts.length === 0 || isFinalizing ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      opacity: parts.length === 0 ? 0.4 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isFinalizing
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                      : <><Download size={14} /> Finalize All Parts & Save Doc</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
