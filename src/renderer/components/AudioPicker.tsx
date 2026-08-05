import React, { useState } from 'react';
import { UploadCloud, FileAudio, ArrowRight } from 'lucide-react';
import { AudioFileInfo } from '../../types';
import { useTranslation } from '../context/LanguageContext';
import { AudioEditor } from './AudioEditor';

interface AudioPickerProps {
  selectedFiles: AudioFileInfo[] | null;
  onSelectFile: () => void;
  isConverting: boolean;
  onConvert: () => void;
  allowMultiple: boolean;
  setAllowMultiple: (val: boolean) => void;
  transcriptionModel: string;
  setTranscriptionModel: (val: string) => void;
  additionalInstructionsEnabled: boolean;
  setAdditionalInstructionsEnabled: (val: boolean) => void;
  additionalInstructionsText: string;
  setAdditionalInstructionsText: (val: string) => void;
  quickPrompts: string[];
  selectedQuickPrompt: string;
  setSelectedQuickPrompt: (val: string) => void;
  exampleDocxFile: File | null;
  setExampleDocxFile: (val: File | null) => void;
  onUpdateFileConfig: (index: number, updates: Partial<AudioFileInfo>) => void;
  onCancelClick: () => void;
}

export const AudioPicker: React.FC<AudioPickerProps> = ({
  selectedFiles,
  onSelectFile,
  isConverting,
  onConvert,
  allowMultiple,
  setAllowMultiple,
  transcriptionModel,
  setTranscriptionModel,
  additionalInstructionsEnabled,
  setAdditionalInstructionsEnabled,
  additionalInstructionsText,
  setAdditionalInstructionsText,
  quickPrompts,
  selectedQuickPrompt,
  setSelectedQuickPrompt,
  exampleDocxFile,
  setExampleDocxFile,
  onUpdateFileConfig,
  onCancelClick
}) => {
  const { t } = useTranslation();
  const [docInputKey, setDocInputKey] = useState(0);

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
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    padding: '0.5rem 0.85rem', 
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        {file.fileName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {formatFileSize(file.fileSize)}
                      </span>
                    </div>
                    <AudioEditor 
                      file={file} 
                      onUpdate={(updates) => onUpdateFileConfig(idx, updates)} 
                      disabled={isConverting}
                    />
                  </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              opacity: isConverting ? 0.6 : 1,
              pointerEvents: isConverting ? 'none' : 'auto'
            }}
          >
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              {t('options.transcribe_with_label')}
            </label>
            <select
              value={transcriptionModel}
              onChange={(e) => setTranscriptionModel(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.6rem 0.7rem',
                color: '#e2e8f0',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="gemini-3.5-flash-lite">{t('options.transcribe_model_1')}</option>
              <option value="gemini-3.5-flash">{t('options.transcribe_model_2')}</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              opacity: isConverting ? 0.6 : 1,
              pointerEvents: isConverting ? 'none' : 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                id="additionalInstructionsCheck"
                checked={additionalInstructionsEnabled}
                onChange={(e) => setAdditionalInstructionsEnabled(e.target.checked)}
                style={{
                  cursor: 'pointer',
                  width: '15px',
                  height: '15px',
                  accentColor: 'var(--primary-accent)'
                }}
              />
              <label
                htmlFor="additionalInstructionsCheck"
                style={{
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  fontWeight: 500,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {t('options.additional_instructions_label')}
              </label>
            </div>

            {additionalInstructionsEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                    Quick Prompt
                  </label>
                  <select
                    value={selectedQuickPrompt}
                    onChange={(e) => setSelectedQuickPrompt(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.7rem',
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Custom">Custom</option>
                    {quickPrompts.map((p, idx) => (
                      <option key={idx} value={p}>
                        {p.length > 60 ? p.substring(0, 60) + '...' : p}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedQuickPrompt === 'Custom' && (
                  <textarea
                    value={additionalInstructionsText}
                    onChange={(e) => setAdditionalInstructionsText(e.target.value)}
                    placeholder={t('options.additional_instructions_placeholder')}
                    rows={4}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '0.7rem 0.85rem',
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      outline: 'none'
                    }}
                  />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                      {t('options.example_docx_label')}
                    </span>
                    {exampleDocxFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExampleDocxFile(null);
                          setDocInputKey((k) => k + 1);
                        }}
                        style={{
                          background: 'rgba(248, 113, 113, 0.08)',
                          border: '1px solid rgba(248, 113, 113, 0.25)',
                          color: '#fca5a5',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {t('common.remove')}
                      </button>
                    )}
                  </div>

                  <input
                    key={docInputKey}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setExampleDocxFile(file);
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.7rem',
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />

                  {exampleDocxFile && (
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      {exampleDocxFile.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            onClick={onConvert}
            disabled={isConverting}
            style={{
              flex: 1,
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

          {isConverting && (
            <button
              onClick={onCancelClick}
              style={{
                flex: 1,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              <span>Cancel</span>
            </button>
          )}
        </div>
        </div>
      )}
    </div>
  );
};
