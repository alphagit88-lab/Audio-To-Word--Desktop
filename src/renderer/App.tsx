import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioPicker } from './components/AudioPicker';
import { ConversionStatusCard } from './components/ConversionStatusCard';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { TranscriptionReviewPanel } from './components/TranscriptionReviewPanel';
import { AudioFileInfo, ConversionProgress, ConversionResult, ConversionResumeState, ConversionPromptOptions, TranscriptionPart } from '../types';
import { LogOut, FileAudio, Users, DownloadCloud, RefreshCw, Clock, File, BarChart3 } from 'lucide-react';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { PartialConversionDialog } from './components/PartialConversionDialog';
import { CancelConfirmationDialog } from './components/CancelConfirmationDialog';

interface UsageStats {
  total_seconds: number;
  total_files: number;
  total_conversions: number;
}

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

  // Usage stats
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // App core states
  const [activeTab, setActiveTab] = useState<'converter' | 'users'>('converter');
  const [selectedFiles, setSelectedFiles] = useState<AudioFileInfo[] | null>(null);
  const [allowMultiple, setAllowMultiple] = useState<boolean>(false);
  const [transcriptionModel, setTranscriptionModel] = useState<string>('gemini-3.5-flash-lite');
  const [additionalInstructionsEnabled, setAdditionalInstructionsEnabled] = useState<boolean>(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [speakerLabels, setSpeakerLabels] = useState<string[]>([]);
  const [selectedQuickPrompt, setSelectedQuickPrompt] = useState<string>('Custom');
  const [additionalInstructionsText, setAdditionalInstructionsText] = useState<string>('');
  const [exampleDocxFile, setExampleDocxFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ConversionProgress>({
    status: 'idle',
    message: '',
    percentage: 0
  });
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [resumeState, setResumeState] = useState<ConversionResumeState | null>(null);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Review panel state
  const [transcriptionParts, setTranscriptionParts] = useState<TranscriptionPart[]>([]);
  const [totalExpectedChunks, setTotalExpectedChunks] = useState(0);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL;

  // ── Update States (forced update before use) ────────────────────────────────
  const [updateState, setUpdateState] = useState<'idle' | 'available' | 'downloading' | 'ready'>('idle');
  const [updateVersion, setUpdateVersion] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateAvailable) return;
    const unsubs = [
      window.electronAPI.onUpdateAvailable((version) => {
        setUpdateVersion(version);
        setUpdateState('available');
      }),
      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateState('ready');
      }),
      window.electronAPI.onUpdateProgress((percent) => {
        setDownloadProgress(percent);
      })
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const handleUpdateAction = () => {
    if (updateState === 'available') {
      setUpdateState('downloading');
      window.electronAPI.startUpdateDownload();
    } else if (updateState === 'ready') {
      window.electronAPI.runDownloadedUpdate();
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

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
      console.error('Failed to fetch service keys:', err);
    }
  };

  const fetchUsageSummary = async (authToken: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/usage/summary`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUsageStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage summary:', err);
    }
  };

  const fetchExtraData = async (authToken: string) => {
    try {
      const promptsRes = await fetch(`${baseUrl}/api/quick-prompts`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
      });
      if (promptsRes.ok) {
        const data = await promptsRes.json();
        setQuickPrompts(data.prompts || []);
      }
    } catch (err) {
      console.error('Failed to fetch quick prompts:', err);
    }

    // Fetch speaker labels
    try {
      const labelsRes = await fetch(`${baseUrl}/api/speaker-labels`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
      });
      if (labelsRes.ok) {
        const data = await labelsRes.json();
        setSpeakerLabels(data.labels || []);
      }
    } catch (err) {
      console.error('Failed to fetch speaker labels:', err);
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
          fetchUsageSummary(storedToken);
          fetchExtraData(storedToken);
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

  // Subscribe to live chunk-transcribed events for the review panel
  useEffect(() => {
    if (!window.electronAPI?.onChunkTranscribed) return;
    const unsubscribe = window.electronAPI.onChunkTranscribed((part) => {
      setTranscriptionParts((prev) => {
        const existing = prev.findIndex((p) => p.chunkIndex === part.chunkIndex);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = part;
          return updated;
        }
        return [...prev, part].sort((a, b) => a.chunkIndex - b.chunkIndex);
      });
      setTotalExpectedChunks(part.total);
      setShowReviewPanel(true); // auto-open on first chunk
    });
    return () => unsubscribe();
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
    fetchUsageSummary(newToken);
    fetchExtraData(newToken);
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
      setUsageStats(null);
      setQuickPrompts([]);
      setSpeakerLabels([]);
      setConversionResult(null);
      setProgress({ status: 'idle', message: '', percentage: 0 });
    }
  };

  const handleUpdateFileConfig = (index: number, updates: Partial<AudioFileInfo>) => {
    if (!selectedFiles) return;
    const newFiles = [...selectedFiles];
    newFiles[index] = { ...newFiles[index], ...updates };
    setSelectedFiles(newFiles);
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

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const runConversion = async (resume?: ConversionResumeState) => {
    const files = resume?.files ?? selectedFiles;
    if (!files || files.length === 0) return;


    setConversionResult(null);
    setShowPartialDialog(false);
    // Reset review panel only for fresh conversions — NOT when resuming,
    // so already-transcribed parts remain visible in the panel.
    if (!resume) {
      setTranscriptionParts([]);
      setTotalExpectedChunks(0);
      setShowReviewPanel(false);
    }
    setProgress({ status: 'reading_file', message: t('converter.status_reading'), percentage: 10 });

    if (apiKeys.length === 0) {
      setConversionResult({
        success: false,
        error: 'No service keys configured on backend.'
      });
      setProgress({ status: 'error', message: 'No service keys configured.', percentage: 0 });
      return;
    }

    try {
      let promptOptions: ConversionPromptOptions = { transcriptionModel };
      if (additionalInstructionsEnabled) {
        let promptToSend = '';
        if (selectedQuickPrompt === 'Custom') {
          promptToSend = additionalInstructionsText.trim();
        } else {
          promptToSend = selectedQuickPrompt;
        }

        let exampleDocx: ConversionPromptOptions['exampleDocx'] | undefined;
        if (exampleDocxFile) {
          const base64 = await readFileAsBase64(exampleDocxFile);
          exampleDocx = {
            fileName: exampleDocxFile.name,
            mimeType: exampleDocxFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            dataBase64: base64
          };
        }
        if (promptToSend) {
          promptOptions.additionalInstructions = promptToSend;
        }
        if (exampleDocx) {
          promptOptions.exampleDocx = exampleDocx;
        }
      }

      const result = await window.electronAPI.convertAudioToDocx(
        files,
        apiKeys,
        resume ? undefined : (token ?? undefined),
        resume,
        promptOptions
      );

      if (result.error === 'AUTH_ERROR') {
        handleLogout();
        return;
      }

      setConversionResult(result);

      if (result.partial && result.resumeState) {
        setResumeState(result.resumeState);
        setShowPartialDialog(true);
      } else {
        setResumeState(null);
        setShowPartialDialog(false);
      }
    } catch (err: any) {
      setConversionResult({
        success: false,
        error: err.message || 'Communication error.'
      });
    }

    if (token) {
      fetchUsageSummary(token);
    }
  };

  const handleConvert = () => runConversion(undefined);

  const handleResumeConversion = () => {
    if (resumeState) {
      runConversion(resumeState);
    }
  };

  const handleRestartConversion = () => {
    setResumeState(null);
    setShowPartialDialog(false);
    runConversion(undefined);
  };

  const handleConfirmCancel = async () => {
    if (window.electronAPI.cancelConversion) {
      await window.electronAPI.cancelConversion();
    }
    setShowCancelDialog(false);
  };

  const handleOpenFolder = (filePath: string) => {
    window.electronAPI.openFolder(filePath);
  };

  const handleReset = () => {
    setSelectedFiles(null);
    setConversionResult(null);
    setResumeState(null);
    setShowPartialDialog(false);
    setTranscriptionParts([]);
    setTotalExpectedChunks(0);
    setShowReviewPanel(false);
    setProgress({ status: 'idle', message: '', percentage: 0 });
  };

  // Review panel callbacks
  const handlePartUpdated = (chunkIndex: number, newText: string, newDocxPath?: string) => {
    setTranscriptionParts((prev) =>
      prev.map((p) => p.chunkIndex === chunkIndex ? { ...p, text: newText, docxPath: newDocxPath } : p)
    );
  };

  const handleFinalize = async (parts: TranscriptionPart[]) => {
    if (parts.length === 0) return;
    setIsFinalizing(true);
    try {
      const sorted = [...parts].sort((a, b) => a.chunkIndex - b.chunkIndex);
      const primaryPath = sorted[0].primaryAudioFilePath;
      const docxPath = await window.electronAPI.finalizeTranscription(
        sorted.map((p) => ({ chunkIndex: p.chunkIndex, text: p.text })),
        primaryPath
      );
      setConversionResult((prev) => prev
        ? { ...prev, success: true, docxPath }
        : { success: true, docxPath }
      );
      setShowReviewPanel(false);
      window.electronAPI.openFolder(docxPath);
    } catch (err: any) {
      console.error('Finalize failed:', err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const isConverting = progress.status !== 'idle' && progress.status !== 'completed' && progress.status !== 'error';

  // Force Update Screen — blocks everything until user installs the update
  if (updateState !== 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
        <Header />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          background: 'var(--bg-gradient)'
        }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '50%', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DownloadCloud size={48} color="#fbbf24" />
          </div>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Update Required — v{updateVersion}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              A new version of the application is available. You must install this update before continuing.
            </p>
          </div>

          {updateState === 'available' && (
            <button
              onClick={handleUpdateAction}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#fff', padding: '0.75rem 2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <DownloadCloud size={18} /> Download &amp; Install Update
            </button>
          )}

          {updateState === 'downloading' && (
            <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Downloading... {Math.round(downloadProgress)}%</span>
            </div>
          )}

          {updateState === 'ready' && (
            <button
              onClick={handleUpdateAction}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '0.75rem 2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={18} /> Restart &amp; Install Now
            </button>
          )}
        </div>
      </div>
    );
  }

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

      {showPartialDialog && conversionResult?.partial && conversionResult.completedChunks !== undefined && conversionResult.totalChunks !== undefined && (
        <PartialConversionDialog
          completedChunks={conversionResult.completedChunks}
          totalChunks={conversionResult.totalChunks}
          docxPath={conversionResult.docxPath}
          onResume={handleResumeConversion}
          onRestart={handleRestartConversion}
          onOpenFolder={handleOpenFolder}
        />
      )}

      {showCancelDialog && (
        <CancelConfirmationDialog
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelDialog(false)}
        />
      )}

      {/* Transcription Review Panel — auto-opens after first chunk, overlaid above everything */}
      {showReviewPanel && (
        <TranscriptionReviewPanel
          parts={transcriptionParts}
          totalChunks={totalExpectedChunks}
          apiKeys={apiKeys}
          transcriptionModel={transcriptionModel}
          onClose={() => setShowReviewPanel(false)}
          onPartUpdated={handlePartUpdated}
          onFinalize={handleFinalize}
          isFinalizing={isFinalizing}
          authToken={token}
          speakerLabels={speakerLabels}
        />
      )}

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
          {usageStats && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px', padding: '0.3rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}><Clock size={10} color="#818cf8" /> Usage:</span>
                <span style={{ fontWeight: 500, color: '#e2e8f0' }}>
                  {Math.floor(usageStats.total_seconds / 3600)} h & {Number(((usageStats.total_seconds % 3600) / 60).toFixed(2))} mins
                </span>
              </div>
            </div>
          )}
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
                transcriptionModel={transcriptionModel}
                setTranscriptionModel={setTranscriptionModel}
                additionalInstructionsEnabled={additionalInstructionsEnabled}
                setAdditionalInstructionsEnabled={setAdditionalInstructionsEnabled}
                quickPrompts={quickPrompts}
                selectedQuickPrompt={selectedQuickPrompt}
                setSelectedQuickPrompt={setSelectedQuickPrompt}
                additionalInstructionsText={additionalInstructionsText}
                setAdditionalInstructionsText={setAdditionalInstructionsText}
                exampleDocxFile={exampleDocxFile}
                setExampleDocxFile={setExampleDocxFile}
                onUpdateFileConfig={handleUpdateFileConfig}
                onCancelClick={() => setShowCancelDialog(true)}
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
