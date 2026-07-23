import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioPicker } from './components/AudioPicker';
import { ConversionStatusCard } from './components/ConversionStatusCard';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { AudioFileInfo, ConversionProgress, ConversionResult } from '../types';
import { LogOut, FileAudio, Users } from 'lucide-react';
import { LanguageProvider, useTranslation } from './context/LanguageContext';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const MainAppContent: React.FC = () => {
  const { t } = useTranslation();

  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // API Key Pool states
  const [apiKeys, setApiKeys] = useState<string[]>([]);

  // App core states
  const [activeTab, setActiveTab] = useState<'converter' | 'users'>('converter');
  const [selectedFiles, setSelectedFiles] = useState<AudioFileInfo[] | null>(null);
  const [allowMultiple, setAllowMultiple] = useState<boolean>(false);
  const [progress, setProgress] = useState<ConversionProgress>({
    status: 'idle',
    message: '',
    percentage: 0
  });
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL;

  // Fetch API keys pool from backend
  const fetchApiKeys = async (authToken: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/api-keys`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.keys) {
        setApiKeys(data.keys);
      }
    } catch (err) {
      console.error('Failed to fetch Gemini API keys pool:', err);
    }
  };

  // Load and validate token on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/validate-token`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Accept': 'application/json'
          }
        });

        const data = await response.json();
        if (response.ok && data.valid) {
          setToken(storedToken);
          setUser(data.user);
          fetchApiKeys(storedToken);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        console.error('Failed to validate token on startup:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (window.electronAPI?.onProgress) {
      const unsubscribe = window.electronAPI.onProgress((prog) => {
        setProgress(prog);
      });
      return () => unsubscribe();
    }
  }, []);

  // Clear selected files when toggling allowMultiple
  useEffect(() => {
    setSelectedFiles(null);
    setConversionResult(null);
    setProgress({ status: 'idle', message: '', percentage: 0 });
  }, [allowMultiple]);

  const handleLoginSuccess = (newToken: string, loggedInUser: AuthUser) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
    setActiveTab('converter');
    fetchApiKeys(newToken);
  };

  const handleLogout = async () => {
    if (!token) return;
    try {
      await fetch(`${baseUrl}/api/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    } catch (err) {
      console.error('Network error during logout:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setSelectedFiles(null);
      setApiKeys([]);
      setConversionResult(null);
      setProgress({ status: 'idle', message: '', percentage: 0 });
    }
  };

  const handleSelectFile = async () => {
    try {
      const filesInfo = await window.electronAPI.selectAudioFile(allowMultiple);
      if (filesInfo && filesInfo.length > 0) {
        setSelectedFiles(filesInfo);
        setConversionResult(null);
        setProgress({ status: 'idle', message: '', percentage: 0 });
      }
    } catch (err) {
      console.error('Failed to select files:', err);
    }
  };

  const handleConvert = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setConversionResult(null);
    setProgress({ status: 'reading_file', message: t('converter.status_reading'), percentage: 10 });

    if (apiKeys.length === 0) {
      setConversionResult({
        success: false,
        error: 'No Gemini API keys configured on backend.'
      });
      setProgress({ status: 'error', message: 'No API keys configured.', percentage: 0 });
      return;
    }

    const filePaths = selectedFiles.map((f) => f.filePath);
    let finalResult: ConversionResult | null = null;

    // Sequential loop over the pool of keys
    for (let i = 0; i < apiKeys.length; i++) {
      const activeKey = apiKeys[i];
      try {
        finalResult = await window.electronAPI.convertAudioToDocx(filePaths, activeKey);

        if (finalResult.success) {
          break; // Succeeded! Exit retry loop
        } else {
          if (finalResult.error?.includes('Network error')) {
            break;
          }
        }
      } catch (err: any) {
        finalResult = {
          success: false,
          error: err.message || 'Communication error.'
        };
      }
    }

    if (finalResult) {
      setConversionResult(finalResult);
    }
  };

  const handleOpenFolder = (filePath: string) => {
    window.electronAPI.openFolder(filePath);
  };

  const handleReset = () => {
    setSelectedFiles(null);
    setConversionResult(null);
    setProgress({ status: 'idle', message: '', percentage: 0 });
  };

  const isConverting = progress.status !== 'idle' && progress.status !== 'completed' && progress.status !== 'error';

  // Splash Loading Screen
  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-gradient)' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.05em' }}>
          Loading Application...
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!token || !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
        <Header />
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Logged In
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />

      {/* Navigation Sub-bar */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user.role === 'admin' ? (
            <>
              <button
                onClick={() => setActiveTab('converter')}
                style={{
                  background: activeTab === 'converter' ? 'rgba(99, 102, 241, 0.15)' : 'none',
                  border: activeTab === 'converter' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: activeTab === 'converter' ? '#a5b4fc' : '#94a3b8',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
              >
                <FileAudio size={14} />
                {t('nav.converter')}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                style={{
                  background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.15)' : 'none',
                  border: activeTab === 'users' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: activeTab === 'users' ? '#a5b4fc' : '#94a3b8',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
              >
                <Users size={14} />
                {t('nav.users')}
              </button>
            </>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileAudio size={14} />
              {t('nav.converter')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {t('nav.user')}: <strong style={{ color: '#cbd5e1' }}>{user.email}</strong>
            {user.role === 'admin' && <span style={{ marginLeft: '0.4rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 600, fontSize: '0.7rem' }}>{t('nav.admin')}</span>}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '0.2rem 0.4rem',
            }}
          >
            <LogOut size={13} />
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Full-width scroll container */}
      <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
        <main style={{ padding: '1.5rem 2rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', maxWidth: '680px', width: '100%', margin: '0 auto', gap: '1.25rem' }}>
          {activeTab === 'converter' ? (
            <>
              <AudioPicker
                selectedFiles={selectedFiles}
                onSelectFile={handleSelectFile}
                isConverting={isConverting}
                onConvert={handleConvert}
                allowMultiple={allowMultiple}
                setAllowMultiple={setAllowMultiple}
              />

              {(progress.status !== 'idle' || conversionResult) && (
                <ConversionStatusCard
                  progress={progress}
                  result={conversionResult}
                  onOpenFolder={handleOpenFolder}
                  onReset={handleReset}
                />
              )}
            </>
          ) : (
            <UserManagement token={token} />
          )}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
};

export default App;
