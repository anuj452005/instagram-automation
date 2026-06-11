import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import {
  Key,
  Video,
  Lock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ArrowRight,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Youtube } from '../components/icons';

interface GoogleAccountInfo {
  connected: boolean;
  account?: {
    id: string;
    email: string;
    displayName: string;
    channelIconUrl: string;
    connectedAt: string;
    tokenStatus: string;
  };
}

interface ElevenLabsSettings {
  elevenLabsKeyConfigured: boolean;
  maskedKey?: string;
  updatedAt?: string;
}

interface DriveVideoFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

interface YouTubeJob {
  id: string;
  title: string;
  description: string | null;
  status: 'queued' | 'generating_audio' | 'merging' | 'uploading' | 'scheduled' | 'completed' | 'failed';
  scheduledPublishTime: string;
  googleDriveFileName: string;
  voiceName: string;
  youtubeVideoId: string | null;
  youtubeVideoUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export const YoutubeDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Notification Toast state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ElevenLabs Key setup local state
  const [editMode, setEditMode] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealTimer, setRevealTimer] = useState<number | null>(null);

  // Form local state
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'public' | 'unlisted'>('private');

  // Trigger token exchange if code is in parameters
  const oauthCode = searchParams.get('code');
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);

  // Toast clearing timers
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // Handle Google callback on mount/render
  useEffect(() => {
    const handleCallback = async () => {
      if (oauthCode && !isConnectingOAuth) {
        setIsConnectingOAuth(true);
        try {
          await api.post('/api/youtube/google-auth/callback', { code: oauthCode });
          setSuccessMessage('Successfully connected Google & YouTube account!');
          queryClient.invalidateQueries({ queryKey: ['youtube-account'] });
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.response?.data?.error || 'Failed to exchange authorization tokens.');
        } finally {
          setIsConnectingOAuth(false);
          // Clean parameters
          searchParams.delete('code');
          searchParams.delete('scope');
          searchParams.delete('authuser');
          searchParams.delete('prompt');
          setSearchParams(searchParams, { replace: true });
        }
      }
    };
    handleCallback();
  }, [oauthCode, isConnectingOAuth, searchParams, setSearchParams, queryClient]);

  // Query 1: Google Account Status
  const { data: googleData, isLoading: isLoadingAccount } = useQuery<GoogleAccountInfo>({
    queryKey: ['youtube-account'],
    queryFn: async () => {
      const res = await api.get('/api/youtube/google-account');
      return res.data;
    },
  });

  // Query 2: ElevenLabs Settings
  const { data: elSettings, isLoading: isLoadingSettings } = useQuery<ElevenLabsSettings>({
    queryKey: ['youtube-settings'],
    queryFn: async () => {
      const res = await api.get('/api/youtube/settings');
      return res.data;
    },
  });

  // Query 3: Google Drive Videos
  const { data: driveVideos = [], isLoading: isLoadingDrive } = useQuery<DriveVideoFile[]>({
    queryKey: ['youtube-drive-videos'],
    queryFn: async () => {
      const res = await api.get('/api/youtube/drive-videos');
      return res.data.files || [];
    },
    enabled: !!googleData?.connected,
    retry: false,
  });

  // Query 4: ElevenLabs Voices
  const { data: elVoices = [], isLoading: isLoadingVoices } = useQuery<ElevenLabsVoice[]>({
    queryKey: ['youtube-voices'],
    queryFn: async () => {
      const res = await api.get('/api/youtube/voices');
      return res.data.voices || [];
    },
    enabled: !!elSettings?.elevenLabsKeyConfigured,
    retry: false,
  });

  // Query 5: YouTube Jobs (Poll if any are in progress)
  const { data: jobsResponse, isLoading: isLoadingJobs } = useQuery<{ jobs: YouTubeJob[] }>({
    queryKey: ['youtube-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/youtube/jobs');
      return res.data;
    },
    refetchInterval: (query) => {
      const hasActive = query.state.data?.jobs?.some((job) =>
        ['queued', 'generating_audio', 'merging', 'uploading'].includes(job.status)
      );
      return hasActive ? 5000 : false;
    },
  });

  const jobs = jobsResponse?.jobs || [];

  // Mutations
  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get('/api/youtube/google-auth/url');
      return res.data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Failed to fetch authorization URL.');
    },
  });

  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/youtube/google-account');
    },
    onSuccess: () => {
      setSuccessMessage('Google account disconnected.');
      queryClient.invalidateQueries({ queryKey: ['youtube-account'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-drive-videos'] });
      setSelectedVideo(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Failed to disconnect account.');
    },
  });

  const updateKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      await api.patch('/api/youtube/settings', { elevenLabsApiKey: key });
    },
    onSuccess: () => {
      setSuccessMessage('ElevenLabs key verified and updated successfully!');
      setEditMode(false);
      setApiKeyInput('');
      queryClient.invalidateQueries({ queryKey: ['youtube-settings'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-voices'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Invalid API Key or verification failed.');
    },
  });

  const scheduleJobMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/api/youtube/schedule', payload);
    },
    onSuccess: () => {
      setSuccessMessage('Short job successfully enqueued!');
      setTitle('');
      setDescription('');
      setScript('');
      setSelectedVideo(null);
      setScheduledTime('');
      queryClient.invalidateQueries({ queryKey: ['youtube-jobs'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Failed to schedule Short generation.');
    },
  });

  // Reveal Key Actions
  const handleRevealKey = async () => {
    if (revealedKey) {
      setRevealedKey(null);
      if (revealTimer) clearTimeout(revealTimer);
      return;
    }

    try {
      const res = await api.get('/api/youtube/settings?reveal=true');
      setRevealedKey(res.data.maskedKey);

      // Reset in 5 seconds
      const timer = window.setTimeout(() => {
        setRevealedKey(null);
      }, 5000);
      setRevealTimer(timer);
    } catch (err: any) {
      setErrorMessage('Failed to decrypt ElevenLabs Key.');
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [revealTimer]);

  const handleScheduleShort = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVideo) {
      setErrorMessage('Please pick a Google Drive video first.');
      return;
    }
    if (!selectedVoice) {
      setErrorMessage('Please select an ElevenLabs voice actor.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('A YouTube Short title is required.');
      return;
    }
    if (!scheduledTime) {
      setErrorMessage('Please configure a scheduled publish date and time.');
      return;
    }

    const voiceObj = elVoices.find((v) => v.voice_id === selectedVoice);
    const voiceName = voiceObj ? voiceObj.name : 'Unknown';

    scheduleJobMutation.mutate({
      title,
      description,
      scheduledPublishTime: scheduledTime,
      googleDriveFileId: selectedVideo.id,
      googleDriveFileName: selectedVideo.name,
      scriptText: script,
      voiceId: selectedVoice,
      voiceName,
      privacyStatus,
    });
  };

  const isSetupFullyComplete = googleData?.connected && elSettings?.elevenLabsKeyConfigured;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {successMessage && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#121214]/90 border border-[#14b8a6]/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="size-6 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-zinc-200 text-sm font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#121214]/90 border border-red-500/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="size-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <AlertCircle className="size-4" />
            </div>
            <span className="text-zinc-200 text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>

      {isConnectingOAuth && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black/70 backdrop-blur-sm gap-4 text-white font-sans">
          <Loader2 className="size-12 text-[#7f22fe] animate-spin" />
          <span className="text-zinc-200 text-lg font-semibold animate-pulse">Syncing Google authorization tokens...</span>
        </div>
      )}

      {/* Grid containing accounts status & keys setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: CONNECT GOOGLE */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] border border-white/5 p-6 rounded-2xl flex flex-col gap-6 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Youtube className="size-5 text-red-500" />
              1. Connect YouTube / Google Account
            </h3>
            {googleData?.connected && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20">
                Connected
              </span>
            )}
          </div>

          {isLoadingAccount ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="size-6 text-[#7f22fe] animate-spin" />
            </div>
          ) : googleData?.connected && googleData.account ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#09090b]/30 border border-white/5">
              <div className="flex items-center gap-3.5 min-w-0">
                {googleData.account.channelIconUrl ? (
                  <img
                    src={googleData.account.channelIconUrl}
                    alt="Channel Icon"
                    className="size-12 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="size-12 rounded-xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                    <Youtube className="size-6" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white text-sm truncate">
                    {googleData.account.displayName}
                  </span>
                  <span className="text-zinc-500 text-xs truncate">
                    {googleData.account.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => disconnectGoogleMutation.mutate()}
                disabled={disconnectGoogleMutation.isPending}
                className="shrink-0 size-10 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                title="Disconnect Account"
              >
                {disconnectGoogleMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-center py-6">
              <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-6">
                Authorize GramFlow to list your Google Drive backgrounds and publish vertical Shorts to YouTube.
              </p>
              <button
                onClick={() => connectGoogleMutation.mutate()}
                disabled={connectGoogleMutation.isPending}
                className="mx-auto rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] text-white px-6 py-3.5 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#7f22fe]/20"
              >
                {connectGoogleMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Connect Google Drive & YouTube
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: ELEVENLABS SETTINGS */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] border border-white/5 p-6 rounded-2xl flex flex-col gap-6 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Key className="size-5 text-yellow-500" />
              2. ElevenLabs Configuration
            </h3>
            {elSettings?.elevenLabsKeyConfigured && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                Configured
              </span>
            )}
          </div>

          {isLoadingSettings ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="size-6 text-[#7f22fe] animate-spin" />
            </div>
          ) : editMode ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateKeyMutation.mutate(apiKeyInput);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase">API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk_..."
                  className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#7f22fe]/40 transition-colors"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={updateKeyMutation.isPending}
                  className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition-all flex justify-center items-center gap-1.5"
                >
                  {updateKeyMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Verify & Save Key'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setApiKeyInput('');
                  }}
                  className="px-4 py-3.5 border border-white/5 hover:border-white/10 text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : elSettings?.elevenLabsKeyConfigured ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#09090b]/30 border border-white/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">API Key Mask</span>
                  <span className="font-mono text-zinc-200 text-sm leading-6 select-all">
                    {revealedKey || elSettings.maskedKey}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRevealKey}
                    className="size-9 rounded-lg border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    title={revealedKey ? 'Hide Key' : 'Reveal Key'}
                  >
                    {revealedKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setApiKeyInput('');
                    }}
                    className="size-9 rounded-lg border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    title="Edit Key"
                  >
                    <Edit2 className="size-4" />
                  </button>
                </div>
              </div>
              {elSettings.updatedAt && (
                <span className="text-[10px] text-zinc-500">
                  Last updated: {new Date(elSettings.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-center py-6">
              <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-6">
                Insert your ElevenLabs Key to unlock automated synthetic voiceovers.
              </p>
              <button
                onClick={() => setEditMode(true)}
                className="mx-auto rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3.5 text-sm font-bold flex items-center gap-2 transition-all"
              >
                Set ElevenLabs API Key
              </button>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: CREATE SHORT FORM */}
      <div className="relative bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] border border-white/5 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* LOCK SCREEN OVERLAY IF CREDENTIALS ARE MISSING */}
        {!isSetupFullyComplete && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center gap-4 text-center p-8">
            <div className="size-16 rounded-2xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500 mb-2 shadow-2xl">
              <Lock className="size-7" />
            </div>
            <h3 className="font-bold text-white text-lg leading-6">Configuration Lock</h3>
            <p className="text-zinc-400 text-sm leading-5 max-w-sm">
              Please connect your Google account and configure your ElevenLabs API Key to unlock this section.
            </p>
          </div>
        )}

        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Video className="size-5 text-[#7f22fe]" />
            3. Generate & Schedule a Short
          </h3>
        </div>

        <form onSubmit={handleScheduleShort} className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Col: Pick Video */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Google Drive Video Picker
              </span>
              
              {isLoadingDrive ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 border border-white/5 bg-[#09090b]/20 rounded-xl">
                  <Loader2 className="size-6 text-[#7f22fe] animate-spin" />
                  <span className="text-zinc-500 text-xs">Scanning Drive folders...</span>
                </div>
              ) : driveVideos.length === 0 ? (
                <div className="border border-dashed border-white/5 bg-[#09090b]/10 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                  <Info className="size-5 text-zinc-500" />
                  <span className="text-sm text-zinc-300 font-semibold">No Videos Found</span>
                  <p className="text-xs text-zinc-500 leading-5 max-w-xs">
                    We scanned your drive but couldn't locate any video files (MP4, MOV, etc.). Upload video assets to your Google Drive and scan again.
                  </p>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto rounded-xl border border-white/5 bg-[#09090b]/30 divide-y divide-white/5 scrollbar-thin">
                  {driveVideos.map((video) => {
                    const isSelected = selectedVideo?.id === video.id;
                    return (
                      <div
                        key={video.id}
                        onClick={() => setSelectedVideo({ id: video.id, name: video.name })}
                        className={`flex items-center gap-3 p-3.5 cursor-pointer transition-all hover:bg-white/5 ${
                          isSelected ? 'bg-[#7f22fe]/10 border-l-2 border-[#7f22fe]' : ''
                        }`}
                      >
                        {video.thumbnailLink ? (
                          <img
                            src={video.thumbnailLink}
                            alt=""
                            className="size-12 object-cover rounded-lg border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="size-12 rounded-lg bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                            <Video className="size-5" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-xs text-white truncate">
                            {video.name}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {video.size ? `${(parseInt(video.size) / (1024 * 1024)).toFixed(1)} MB` : 'Size Unknown'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedVideo && (
                <div className="flex items-center gap-2 p-3 bg-[#14b8a6]/5 border border-[#14b8a6]/20 rounded-xl">
                  <CheckCircle2 className="size-4 text-[#14b8a6] shrink-0" />
                  <span className="text-xs font-semibold text-zinc-300 truncate">
                    Picked: {selectedVideo.name}
                  </span>
                </div>
              )}
            </div>

            {/* Right Col: Details */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Short Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My awesome vertical short!"
                  maxLength={100}
                  className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7f22fe]/40 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Check out this scheduled YouTube Short! #shorts #viral"
                  rows={2}
                  className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7f22fe]/40 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Voice Actor</label>
                  {isLoadingVoices ? (
                    <div className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 flex items-center justify-center">
                      <Loader2 className="size-4 text-zinc-500 animate-spin" />
                    </div>
                  ) : (
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7f22fe]/40 transition-colors"
                      required
                    >
                      <option value="">Select voice...</option>
                      {elVoices.map((voice) => (
                        <option key={voice.voice_id} value={voice.voice_id}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Privacy Settings</label>
                  <select
                    value={privacyStatus}
                    onChange={(e) => setPrivacyStatus(e.target.value as any)}
                    className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7f22fe]/40 transition-colors"
                  >
                    <option value="private">Private (Default / Scheduled)</option>
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Scheduled Release Time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-xl bg-[#09090b] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7f22fe]/40 transition-colors"
                    required
                  />
                </div>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />
                  YouTube scheduled uploads must be set at least 30-60 minutes in the future.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/5 pt-6">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <label className="font-semibold uppercase">Voiceover Script Text</label>
              <span>{script.length} characters</span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Type out the exact words for the Short voiceover script. Keep it under 60 seconds (usually ~100-150 words)."
              rows={4}
              maxLength={1500}
              className="rounded-xl bg-[#09090b] border border-white/5 px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#7f22fe]/40 transition-colors resize-y"
              required
            />
            {script.length > 900 && (
              <span className="text-[10px] text-yellow-500 flex items-center gap-1.5 leading-4">
                <AlertCircle className="size-3.5 shrink-0" />
                Script is becoming quite long. Consider shortening to ensure the render stays under the 60 seconds YouTube Short limit.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={scheduleJobMutation.isPending || !isSetupFullyComplete}
            className="w-full py-4 bg-[#7f22fe] hover:bg-[#9647ff] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#7f22fe]/20 flex justify-center items-center gap-2"
          >
            {scheduleJobMutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Calendar className="size-5" />
                Generate & Schedule Short
              </>
            )}
          </button>
        </form>
      </div>

      {/* SECTION 4: JOB HISTORY */}
      <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] border border-white/5 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Clock className="size-5 text-[#14b8a6]" />
            4. Job History & Status Logs
          </h3>
          {jobs.some((j) => ['queued', 'generating_audio', 'merging', 'uploading'].includes(j.status)) && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-[#7f22fe]" />
              Processing active rendering...
            </span>
          )}
        </div>

        {isLoadingJobs ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="size-8 text-[#7f22fe] animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center flex flex-col justify-center items-center gap-4">
            <div className="size-14 rounded-xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500">
              <Youtube className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-zinc-300 text-sm">No Jobs Enqueued</span>
              <p className="text-zinc-500 text-xs leading-5">
                Your scheduled Short render logs will appear here once submitted.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase font-bold">
                  <th className="p-4">Title</th>
                  <th className="p-4">Source Video</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Scheduled For</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4">YouTube Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {jobs.map((job) => {
                  return (
                    <tr key={job.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold text-white max-w-[200px] truncate" title={job.title}>
                        {job.title}
                      </td>
                      <td className="p-4 max-w-[180px] truncate text-zinc-400 text-xs">
                        {job.googleDriveFileName}
                      </td>
                      <td className="p-4">
                        {job.status === 'queued' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            Queued
                          </span>
                        )}
                        {job.status === 'generating_audio' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                            Audio Generation
                          </span>
                        )}
                        {job.status === 'merging' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse">
                            FFmpeg Merging
                          </span>
                        )}
                        {job.status === 'uploading' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                            Uploading API
                          </span>
                        )}
                        {job.status === 'scheduled' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20">
                            Scheduled ✓
                          </span>
                        )}
                        {job.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            Completed ✓
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <div className="relative group inline-block">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 cursor-help">
                              Failed
                            </span>
                            {job.errorMessage && (
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-30 w-64 bg-zinc-950 border border-red-500/30 p-3 rounded-lg text-xs text-zinc-300 shadow-2xl leading-5">
                                {job.errorMessage}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-zinc-400">
                        {new Date(job.scheduledPublishTime).toLocaleString()}
                      </td>
                      <td className="p-4 text-xs text-zinc-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {job.youtubeVideoUrl ? (
                          <a
                            href={job.youtubeVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#7f22fe] hover:text-[#9647ff] font-semibold transition-colors"
                          >
                            Watch
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
