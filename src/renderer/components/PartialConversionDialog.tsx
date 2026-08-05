import React from 'react';
import { AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface PartialConversionDialogProps {
  completedChunks: number;
  totalChunks: number;
  docxPath?: string;
  onResume: () => void;
  onRestart: () => void;
  onOpenFolder?: (path: string) => void;
}

export const PartialConversionDialog: React.FC<PartialConversionDialogProps> = ({
  completedChunks,
  totalChunks,
  docxPath,
  onResume,
  onRestart,
  onOpenFolder
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
              {t('partial.title')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
              {t('partial.message', { completed: completedChunks, total: totalChunks })}
            </p>
            {docxPath && (
              <p style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                {docxPath}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            onClick={onResume}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Play size={16} />
            {t('partial.btn_resume')}
          </button>

          <button
            onClick={onRestart}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCcw size={16} />
            {t('partial.btn_restart')}
          </button>

          {docxPath && onOpenFolder && (
            <button
              onClick={() => onOpenFolder(docxPath)}
              style={{
                background: 'none',
                border: 'none',
                color: '#818cf8',
                padding: '0.4rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {t('partial.btn_open_partial')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
