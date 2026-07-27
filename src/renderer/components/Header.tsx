import React from 'react';
import { Sparkles, FileAudio, Globe } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  
  return (
    <header style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          padding: '0.6rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        }}>
          <FileAudio size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('app.title')}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t('app.subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
{/* Language Switcher Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '0.2rem',
          fontSize: '0.75rem'
        }}>
          <Globe size={14} style={{ color: '#818cf8', marginLeft: '0.5rem', marginRight: '0.3rem' }} />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            style={{
              background: language === 'en' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'none',
              color: language === 'en' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '14px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: language === 'en' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('si')}
            style={{
              background: language === 'si' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'none',
              color: language === 'si' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '14px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: language === 'si' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            සිංහල
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '0.4rem 0.8rem',
          borderRadius: '20px',
          fontSize: '0.75rem',
          color: '#a5b4fc'
        }}>
          <Sparkles size={14} color="#818cf8" />
          <span>Professional Edition</span>
        </div>
      </div>
    </header>
  );
};
