import React from 'react';
import { CheckCircle2, AlertCircle, Folder, Loader2 } from 'lucide-react';
import { ConversionProgress, ConversionResult } from '../../types';
import { useTranslation } from '../context/LanguageContext';

interface ConversionStatusCardProps {
  progress: ConversionProgress;
  result: ConversionResult | null;
  onOpenFolder: (path: string) => void;
  onReset: () => void;
}

export const ConversionStatusCard: React.FC<ConversionStatusCardProps> = ({
  progress,
  result,
  onOpenFolder,
  onReset
}) => {
  const { t } = useTranslation();

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', marginTop: '1.5rem' }}>
      {/* Active Conversion Progress Bar */}
      {progress.status !== 'completed' && progress.status !== 'error' && progress.status !== 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={22} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                {t('converter.btn_converting')}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{progress.message}</p>
            </div>
          </div>

          <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress.percentage}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                height: '100%',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Success State Card */}
      {result && result.success && result.docxPath && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <CheckCircle2 size={24} color="#10b981" style={{ marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981' }}>
                {t('result.success_title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                {t('result.output_path')}
              </p>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#a5b4fc',
                wordBreak: 'break-all',
                marginTop: '0.5rem',
                fontFamily: 'monospace'
              }}>
                {result.docxPath}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => onOpenFolder(result.docxPath!)}
              style={{
                flex: 1,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Folder size={16} />
              <span>{t('result.btn_open')}</span>
            </button>

            <button
              onClick={onReset}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {t('result.btn_convert_another')}
            </button>
          </div>
        </div>
      )}

      {/* Partial Success State */}
      {result && result.partial && result.docxPath && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertCircle size={24} color="#fbbf24" style={{ marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fbbf24' }}>
                {t('partial.saved_title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                {t('partial.saved_desc', {
                  completed: result.completedChunks ?? 0,
                  total: result.totalChunks ?? 0
                })}
              </p>
              {result.error && (
                <p style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.35rem' }}>{t('converter.error_failed_transcribe')}</p>
              )}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#a5b4fc',
                wordBreak: 'break-all',
                marginTop: '0.5rem',
                fontFamily: 'monospace'
              }}>
                {result.docxPath}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => onOpenFolder(result.docxPath!)}
              style={{
                flex: 1,
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                color: '#fcd34d',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Folder size={16} />
              <span>{t('partial.btn_open_partial')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error State Card */}
      {result && !result.success && !result.partial && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertCircle size={24} color="#ef4444" style={{ marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>
              {t('converter.status_error')}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.2rem' }}>
              {t('converter.error_failed_transcribe')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
