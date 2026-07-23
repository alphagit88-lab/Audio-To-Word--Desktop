import React from 'react';
import { UploadCloud, FileAudio, ArrowRight } from 'lucide-react';
import { AudioFileInfo } from '../../types';
import { useTranslation } from '../context/LanguageContext';

interface AudioPickerProps {
  selectedFiles: AudioFileInfo[] | null;
  onSelectFile: () => void;
  isConverting: boolean;
  onConvert: () => void;
  allowMultiple: boolean;
  setAllowMultiple: (val: boolean) => void;
}

export const AudioPicker: React.FC<AudioPickerProps> = ({
  selectedFiles,
  onSelectFile,
  isConverting,
  onConvert,
  allowMultiple,
  setAllowMultiple
}) => {
  const { t } = useTranslation();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasFiles = selectedFiles && selectedFiles.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Accuracy Helper Checkbox */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          background: 'rgba(99, 102, 241, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          padding: '0.75rem 1rem', 
          borderRadius: '10px',
          opacity: isConverting ? 0.6 : 1,
          pointerEvents: isConverting ? 'none' : 'auto'
        }}
      >
        <input
          type="checkbox"
          id="allowMultipleCheck"
          checked={allowMultiple}
          onChange={(e) => setAllowMultiple(e.target.checked)}
          style={{ 
            cursor: 'pointer',
            width: '15px',
            height: '15px',
            accentColor: 'var(--primary-accent)'
          }}
        />
        <label 
          htmlFor="allowMultipleCheck" 
          style={{ 
            fontSize: '0.85rem', 
            color: '#e2e8f0', 
            fontWeight: 500, 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          {t('options.accuracy_label')}
        </label>
      </div>

      {/* Interactive File Selector Drop Area */}
      <div
        onClick={!isConverting ? onSelectFile : undefined}
        style={{
          border: hasFiles ? '2px solid #6366f1' : '2px dashed rgba(255, 255, 255, 0.2)',
          background: hasFiles ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
          borderRadius: '16px',
          padding: hasFiles ? '2rem 1.5rem' : '2.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isConverting ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}
      >
        {hasFiles ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', width: '100%' }}>
            <div style={{ background: '#6366f1', padding: '0.85rem', borderRadius: '50%', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
              <FileAudio size={30} color="#ffffff" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '480px' }}>
              {selectedFiles.map((file, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    padding: '0.5rem 0.85rem', 
                    borderRadius: '8px',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                    {file.fileName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              ))}
            </div>

            <span style={{ fontSize: '0.8rem', color: '#818cf8', marginTop: '0.25rem' }}>
              {allowMultiple ? t('converter.change_files') : t('converter.change_file')}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1.25rem', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <UploadCloud size={40} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>
                {t('converter.drop_title')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {allowMultiple ? t('converter.drop_desc_multi') : t('converter.drop_desc_single')}
              </p>
            </div>
            <button
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {allowMultiple ? t('converter.btn_browse_multi') : t('converter.btn_browse')}
            </button>
          </div>
        )}
      </div>

      {/* Convert Trigger Button */}
      {hasFiles && (
        <button
          onClick={onConvert}
          disabled={isConverting}
          style={{
            background: isConverting
              ? 'rgba(99, 102, 241, 0.5)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isConverting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: isConverting ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <span>{isConverting ? t('converter.btn_converting') : t('converter.btn_convert')}</span>
          {!isConverting && <ArrowRight size={20} />}
        </button>
      )}
    </div>
  );
};
