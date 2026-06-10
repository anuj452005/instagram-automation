import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAutomations, useAutomation } from '../hooks/useAutomations';
import { useLinkableAccounts } from '../hooks/useLinkableAccounts';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  Zap,
  MessageSquare,
  Filter,
  Send,
  Eye,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface KeywordItem {
  keyword: string;
  matchType: 'exact' | 'contains' | 'starts_with';
}

export const AutomationBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const { connectedAccounts, isLoadingConnected } = useLinkableAccounts();
  const { createAutomation, updateAutomation, isCreating, isUpdating } = useAutomations();
  const { automation, isLoading: isLoadingAutomation, error: fetchError } = useAutomation(id);

  // Form States
  const [name, setName] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'archived'>('draft');
  const [flowType, setFlowType] = useState<'dm' | 'landing_page'>('dm');
  const [dmTemplate, setDmTemplate] = useState('');
  const [isGlobalTrigger, setIsGlobalTrigger] = useState(true);
  const [postId, setPostId] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [postType, setPostType] = useState<'FEED' | 'REEL' | 'STORY'>('FEED');
  const [collectLeads, setCollectLeads] = useState(false);
  const [leadFields, setLeadFields] = useState<string[]>(['email']);
  const [alsoReplyComment, setAlsoReplyComment] = useState(false);
  const [commentReplyText, setCommentReplyText] = useState('');
  const [scheduledActivateAt, setScheduledActivateAt] = useState('');

  // Keyword tag manager state
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordMatchType, setNewKeywordMatchType] = useState<'exact' | 'contains' | 'starts_with'>('exact');

  // Notification Toast state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hydrate fields if in Edit Mode
  useEffect(() => {
    if (isEditMode && automation) {
      setName(automation.name);
      setInstagramAccountId(automation.instagramAccountId);
      setStatus(automation.status);
      setFlowType(automation.flowType);
      setDmTemplate(automation.dmTemplate);
      setIsGlobalTrigger(!automation.postId);
      setPostId(automation.postId || '');
      setPostUrl(automation.postUrl || '');
      setPostType(automation.postType || 'FEED');
      setCollectLeads(automation.collectLeads);
      setLeadFields(automation.leadFields || ['email']);
      setAlsoReplyComment(automation.alsoReplyComment);
      setCommentReplyText(automation.commentReplyText || '');
      
      if (automation.scheduledActivateAt) {
        // format ISO string to datetime-local input format: YYYY-MM-DDTHH:MM
        const dateObj = new Date(automation.scheduledActivateAt);
        const formattedDate = dateObj.toISOString().slice(0, 16);
        setScheduledActivateAt(formattedDate);
      } else {
        setScheduledActivateAt('');
      }

      setKeywords(
        automation.keywords.map((k) => ({
          keyword: k.keyword,
          matchType: k.matchType,
        }))
      );
    }
  }, [isEditMode, automation]);

  // Set default Instagram account if available
  useEffect(() => {
    if (!isEditMode && connectedAccounts.length > 0 && !instagramAccountId) {
      setInstagramAccountId(connectedAccounts[0].id);
    }
  }, [isEditMode, connectedAccounts, instagramAccountId]);

  // Handle keyword tag operations
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = newKeyword.trim().toLowerCase();
    if (!keyword) return;

    if (keywords.some((k) => k.keyword === keyword)) {
      setValidationError('Keyword already added.');
      return;
    }

    setKeywords([...keywords, { keyword, matchType: newKeywordMatchType }]);
    setNewKeyword('');
    setValidationError(null);
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k.keyword !== keywordToRemove));
  };

  const handleToggleLeadField = (field: string) => {
    if (leadFields.includes(field)) {
      if (leadFields.length === 1) {
        setValidationError('At least one lead field must be collected.');
        return;
      }
      setLeadFields(leadFields.filter((f) => f !== field));
    } else {
      setLeadFields([...leadFields, field]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation checks
    if (!name.trim()) {
      setValidationError('Please enter a campaign name.');
      return;
    }
    if (!instagramAccountId) {
      setValidationError('Please select a connected Instagram profile.');
      return;
    }
    if (keywords.length === 0) {
      setValidationError('Please add at least one trigger keyword.');
      return;
    }
    if (!dmTemplate.trim()) {
      setValidationError('Please specify the DM response template text.');
      return;
    }
    if (!isGlobalTrigger && !postId.trim()) {
      setValidationError('Please enter a specific Post ID to target.');
      return;
    }
    if (alsoReplyComment && !commentReplyText.trim()) {
      setValidationError('Please enter comment reply text.');
      return;
    }

    const payload = {
      instagramAccountId,
      name: name.trim(),
      flowType,
      dmTemplate: dmTemplate.trim(),
      status,
      postId: isGlobalTrigger ? null : postId.trim(),
      postUrl: isGlobalTrigger ? null : postUrl.trim(),
      postType: isGlobalTrigger ? null : postType,
      collectLeads,
      leadFields,
      alsoReplyComment,
      commentReplyText: alsoReplyComment ? commentReplyText.trim() : null,
      scheduledActivateAt: scheduledActivateAt ? new Date(scheduledActivateAt).toISOString() : null,
      keywords: keywords.map((k) => ({
        keyword: k.keyword,
        matchType: k.matchType,
      })),
    };

    try {
      if (isEditMode && id) {
        await updateAutomation({ id, payload });
      } else {
        await createAutomation(payload);
      }
      setSuccessMessage(isEditMode ? 'Automation updated successfully!' : 'Automation created successfully!');
      setTimeout(() => {
        navigate('/dashboard/automations');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setValidationError(
        axiosErr.response?.data?.error?.message || 'Failed to save automation. Verify requirements and try again.'
      );
    }
  };

  const getMatchTypeText = (type: string) => {
    switch (type) {
      case 'contains':
        return 'Contains';
      case 'starts_with':
        return 'Starts';
      default:
        return 'Exact';
    }
  };

  if (isEditMode && isLoadingAutomation) {
    return (
      <div className="flex flex-col justify-center items-center gap-4 py-24 w-full">
        <Loader2 className="size-10 text-[#7f22fe] animate-spin" />
        <span className="text-zinc-400 text-sm font-medium animate-pulse">Loading campaign details...</span>
      </div>
    );
  }

  if (isEditMode && fetchError) {
    return (
      <div className="border border-red-500/10 bg-red-500/5 rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-xl mx-auto w-full my-6">
        <AlertCircle className="size-12 text-red-500" />
        <h3 className="font-semibold text-lg text-white">Campaign Fetch Failed</h3>
        <p className="text-zinc-400 text-sm leading-6">
          The requested automation campaign could not be loaded. Ensure the ID is valid or review user connection.
        </p>
        <Link to="/dashboard/automations" className="rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white px-5 py-2.5 font-semibold text-sm transition-all flex items-center gap-2">
          <ArrowLeft className="size-4" />
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
      {/* Toast notifications */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-[#121214]/95 border border-[#14b8a6]/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <div className="size-6 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
            <CheckCircle2 className="size-4" />
          </div>
          <span className="text-zinc-200 text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Nav back bar */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/automations"
          className="size-10 rounded-xl border border-white/5 hover:border-white/10 bg-[#121214]/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {isEditMode ? 'Edit Automation Campaign' : 'Create Campaign Flow'}
          </h2>
          <span className="text-zinc-400 text-xs">
            {isEditMode ? 'Update trigger parameters and message responses.' : 'Configure comment keywords, targeting filters, and response templates.'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Configurations columns */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">
          {/* Main settings card */}
          <div className="rounded-2xl border border-white/5 bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl p-6 flex flex-col gap-5">
            <h3 className="font-semibold text-sm leading-6 text-white uppercase tracking-wider text-zinc-500">
              Basic Settings
            </h3>
            
            {validationError && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs leading-5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-zinc-300 text-xs font-semibold">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Free Book Offer"
                  className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                />
              </div>

              {/* Account selection */}
              <div className="flex flex-col gap-2">
                <label className="text-zinc-300 text-xs font-semibold">Instagram Profile</label>
                {isLoadingConnected ? (
                  <div className="flex items-center gap-2 h-11 border border-white/5 bg-[#09090b]/20 rounded-xl px-4 text-xs text-zinc-500">
                    <Loader2 className="size-3.5 text-zinc-500 animate-spin" />
                    <span>Loading profiles...</span>
                  </div>
                ) : connectedAccounts.length === 0 ? (
                  <div className="flex items-center gap-2 h-11 border border-dashed border-red-500/20 bg-red-500/5 rounded-xl px-4 text-xs text-red-400">
                    <span>No connected accounts found. Go link one in settings first!</span>
                  </div>
                ) : (
                  <select
                    value={instagramAccountId}
                    onChange={(e) => setInstagramAccountId(e.target.value)}
                    className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 px-4 text-sm text-white outline-none transition-all cursor-pointer"
                  >
                    {connectedAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-[#121214]">
                        @{acc.username} ({acc.name || 'No Name'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-zinc-300 text-xs font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 px-4 text-sm text-white outline-none transition-all cursor-pointer"
                >
                  <option value="draft" className="bg-[#121214]">Draft (Inactive)</option>
                  <option value="active" className="bg-[#121214]">Active (Live replying)</option>
                  <option value="paused" className="bg-[#121214]">Paused (Suspended)</option>
                  <option value="archived" className="bg-[#121214]">Archived</option>
                </select>
              </div>

              {/* Flow Type */}
              <div className="flex flex-col gap-2">
                <label className="text-zinc-300 text-xs font-semibold">Flow Type</label>
                <select
                  value={flowType}
                  onChange={(e) => setFlowType(e.target.value as any)}
                  className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 px-4 text-sm text-white outline-none transition-all cursor-pointer"
                >
                  <option value="dm" className="bg-[#121214]">Standard DM Auto-Reply</option>
                  <option value="landing_page" className="bg-[#121214]">Interactive Landing Page Link</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trigger configurations */}
          <div className="rounded-2xl border border-white/5 bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl p-6 flex flex-col gap-5">
            <h3 className="font-semibold text-sm leading-6 text-white uppercase tracking-wider text-zinc-500">
              Trigger Scope & Targeting
            </h3>

            {/* Scope selectors */}
            <div className="flex flex-col gap-4">
              <label className="text-zinc-300 text-xs font-semibold">Target Post Scope</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsGlobalTrigger(true)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isGlobalTrigger
                      ? 'border-[#7f22fe] bg-[#7f22fe]/5 shadow-[0_0_15px_rgba(127,34,254,0.15)]'
                      : 'border-white/5 bg-[#09090b]/20 hover:border-white/10'
                  }`}
                >
                  <span className="text-white text-sm font-semibold">All Posts (Global Trigger)</span>
                  <span className="text-zinc-500 text-xs leading-4">Trigger whenever a keyword is typed on ANY comment.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGlobalTrigger(false)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    !isGlobalTrigger
                      ? 'border-[#7f22fe] bg-[#7f22fe]/5 shadow-[0_0_15px_rgba(127,34,254,0.15)]'
                      : 'border-white/5 bg-[#09090b]/20 hover:border-white/10'
                  }`}
                >
                  <span className="text-white text-sm font-semibold">Specific Post targeting</span>
                  <span className="text-zinc-500 text-xs leading-4">Restrict keywords checking to one individual post.</span>
                </button>
              </div>

              {/* Specific targeting inputs */}
              {!isGlobalTrigger && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-white/5 bg-[#09090b]/20 rounded-xl mt-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-xs">Post Media Type</label>
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as any)}
                      className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="FEED">Feed Post</option>
                      <option value="REEL">Instagram Reel</option>
                      <option value="STORY">Instagram Story</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-zinc-400 text-xs">Instagram Post ID</label>
                    <input
                      type="text"
                      value={postId}
                      onChange={(e) => setPostId(e.target.value)}
                      placeholder="e.g. 1802938172651427"
                      className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-zinc-700 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-3">
                    <label className="text-zinc-400 text-xs">Post URL (Optional, for visual helpers)</label>
                    <input
                      type="text"
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      placeholder="e.g. https://www.instagram.com/p/Cw9vP8t..."
                      className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-zinc-700 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Keyword tag box */}
            <div className="flex flex-col gap-4">
              <label className="text-zinc-300 text-xs font-semibold">Trigger Keywords</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g. price, link, ebook"
                    className="w-full bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword(e);
                      }
                    }}
                  />
                </div>
                
                <select
                  value={newKeywordMatchType}
                  onChange={(e) => setNewKeywordMatchType(e.target.value as any)}
                  className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 rounded-xl px-4 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="exact">Exact Match</option>
                  <option value="contains">Contains Word</option>
                  <option value="starts_with">Starts With</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="bg-[#7f22fe]/20 hover:bg-[#7f22fe] border border-[#7f22fe]/30 hover:border-transparent text-white px-4 rounded-xl transition-all flex items-center justify-center"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Keywords List Rendering */}
              {keywords.length === 0 ? (
                <div className="bg-[#09090b]/20 border border-dashed border-white/5 rounded-xl p-4 text-center text-xs text-zinc-500">
                  No trigger keywords configured. Add keywords above (type and click Add or hit Enter).
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 p-3 border border-white/5 bg-[#09090b]/10 rounded-xl">
                  {keywords.map((k) => (
                    <span
                      key={k.keyword}
                      className="inline-flex items-center gap-1.5 bg-[#1a1a1e] border border-[#7f22fe]/20 text-zinc-200 rounded-lg pl-3 pr-2 py-1.5 text-xs font-medium"
                    >
                      <span className="text-[#7f22fe] font-bold">#</span>
                      {k.keyword}
                      <span className="text-[9px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded ml-1.5 uppercase font-semibold tracking-wider">
                        {getMatchTypeText(k.matchType)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(k.keyword)}
                        className="size-4.5 rounded hover:bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center transition-all ml-1.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Response payload & actions configuration */}
          <div className="rounded-2xl border border-white/5 bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl p-6 flex flex-col gap-6">
            <h3 className="font-semibold text-sm leading-6 text-white uppercase tracking-wider text-zinc-500">
              Response Flow & Automation Actions
            </h3>

            {/* DM response template text */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-zinc-300 text-xs font-semibold">Direct Message response template</label>
                <span className="text-[10px] text-zinc-500">{dmTemplate.length} characters</span>
              </div>
              <textarea
                value={dmTemplate}
                onChange={(e) => setDmTemplate(e.target.value)}
                placeholder="Hi there! Here is the details link you requested: https://example.com/ebook-offer"
                className="w-full bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 outline-none h-28 resize-none transition-all"
              />
            </div>

            {/* Comment reply configuration */}
            <div className="flex flex-col gap-3.5 p-4 bg-[#09090b]/20 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-zinc-200 text-sm font-semibold">Also Reply to Comment</span>
                  <span className="text-zinc-500 text-xs">Post a comment reply in the post thread along with sending the DM.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAlsoReplyComment(!alsoReplyComment)}
                  className={`w-11 h-6 rounded-full p-1 transition-all ${
                    alsoReplyComment ? 'bg-[#7f22fe]' : 'bg-zinc-800'
                  }`}
                >
                  <div
                    className={`size-4 rounded-full bg-white transition-transform ${
                      alsoReplyComment ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {alsoReplyComment && (
                <div className="flex flex-col gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-zinc-400 text-xs">Comment reply text</label>
                  <input
                    type="text"
                    value={commentReplyText}
                    onChange={(e) => setCommentReplyText(e.target.value)}
                    placeholder="Check your inbox, I've just sent you the details! 🚀"
                    className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder:text-zinc-700 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Lead capture configuration */}
            <div className="flex flex-col gap-3.5 p-4 bg-[#09090b]/20 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5">
                    <Sparkles className="size-4 text-[#7f22fe]" />
                    Conversational Lead Capture
                  </span>
                  <span className="text-zinc-500 text-xs">Auto-collect user details (email/phone) in the chat before fulfilling.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCollectLeads(!collectLeads)}
                  className={`w-11 h-6 rounded-full p-1 transition-all ${
                    collectLeads ? 'bg-[#7f22fe]' : 'bg-zinc-800'
                  }`}
                >
                  <div
                    className={`size-4 rounded-full bg-white transition-transform ${
                      collectLeads ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {collectLeads && (
                <div className="flex flex-col gap-3.5 mt-2 animate-in slide-in-from-top-2 duration-200 border-t border-white/5 pt-3">
                  <span className="text-zinc-400 text-xs font-medium">Fields to Collect:</span>
                  <div className="flex gap-4">
                    {['email', 'phone', 'name'].map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => handleToggleLeadField(field)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs border font-semibold capitalize transition-all ${
                          leadFields.includes(field)
                            ? 'border-[#7f22fe]/40 bg-[#7f22fe]/10 text-white'
                            : 'border-white/5 bg-[#09090b]/30 text-zinc-500 hover:text-white'
                        }`}
                      >
                        <div
                          className={`size-1.5 rounded-full ${
                            leadFields.includes(field) ? 'bg-[#7f22fe]' : 'bg-zinc-600'
                          }`}
                        />
                        {field}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scheduled Activation */}
            <div className="flex flex-col gap-2">
              <label className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="size-3.5 text-zinc-500" />
                Scheduled Activation Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledActivateAt}
                onChange={(e) => setScheduledActivateAt(e.target.value)}
                className="bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 px-4 text-sm text-white outline-none transition-all cursor-pointer w-72"
              />
              <span className="text-[10px] text-zinc-500 leading-4">
                If specified, this campaign will remain in draft/scheduled mode until the target activation timestamp is reached.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3.5">
            <Link
              to="/dashboard/automations"
              className="rounded-xl border border-white/5 hover:border-white/10 hover:bg-[#1a1a1e] text-zinc-300 px-6 py-3 text-sm font-semibold transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] text-white px-7 py-3 text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#7f22fe]/20"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Zap className="size-4" />
                  Save Campaign
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right side live flow visual chart */}
        <div className="flex flex-col gap-6 sticky top-8">
          <div className="rounded-2xl border border-white/5 bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Eye className="size-4.5 text-[#7f22fe]" />
                Live Campaign Preview
              </h3>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Flow Map</span>
            </div>

            {/* flowchart mapping */}
            <div className="relative bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:14px_14px] border border-white/5 bg-[#09090b]/40 rounded-xl p-5 flex flex-col items-stretch gap-6 overflow-hidden min-h-[300px]">
              
              {/* Node 1: Trigger */}
              <div className="rounded-xl border border-[#7f22fe]/30 bg-[#1a1a1e]/90 p-3.5 flex flex-col gap-1.5 shadow-[0_0_15px_rgba(127,34,254,0.1)] transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-[#7f22fe]" />
                  <span className="font-bold text-xs text-white">1. Trigger Condition</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-4">
                  Comment matches {keywords.length > 0 ? (
                    <span className="font-bold text-white">
                      "{keywords.slice(0, 3).map((k) => k.keyword).join(', ')}{keywords.length > 3 ? '...' : ''}"
                    </span>
                  ) : (
                    <span className="text-zinc-600 italic">None</span>
                  )}
                  {postId ? ` on Post ${postId}` : ' on any active post'}
                </div>
              </div>

              {/* Connector line 1 */}
              <div className="flex justify-center items-center h-4 relative">
                <div className="w-0.5 bg-[linear-gradient(180deg,#7f22fe,#d946ef)] h-8 absolute top-[-10px] bottom-[-10px]" />
              </div>

              {/* Node 2: Conditions */}
              <div className="rounded-xl border border-white/5 bg-[#1a1a1e]/80 p-3.5 flex flex-col gap-1.5 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-1.5">
                  <Filter className="size-4 text-[#d946ef]" />
                  <span className="font-bold text-xs text-white">2. Execution checks</span>
                </div>
                <ul className="text-[10px] text-zinc-500 flex flex-col gap-1 list-disc pl-4 leading-4">
                  <li>Profile @{connectedAccounts.find((a) => a.id === instagramAccountId)?.username || 'selected'} is linked</li>
                  <li>User is authenticated</li>
                  {collectLeads && <li>Conversational flow collects {leadFields.join(', ')}</li>}
                </ul>
              </div>

              {/* Connector line 2 */}
              <div className="flex justify-center items-center h-4 relative">
                <div className="w-0.5 bg-[linear-gradient(180deg,#d946ef,#14b8a6)] h-8 absolute top-[-10px] bottom-[-10px]" />
              </div>

              {/* Node 3: Dispatch actions */}
              <div className="rounded-xl border border-[#14b8a6]/20 bg-[#1a1a1e]/90 p-3.5 flex flex-col gap-2 shadow-[0_0_15px_rgba(20,184,166,0.06)] transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-1.5">
                  <Send className="size-4 text-[#14b8a6]" />
                  <span className="font-bold text-xs text-white">3. Dispatched responses</span>
                </div>
                
                <div className="flex flex-col gap-1 bg-[#09090b]/40 rounded-lg p-2 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Direct Message:</span>
                  <p className="text-[10px] text-zinc-400 italic leading-4 line-clamp-3">
                    {dmTemplate.trim() ? `"${dmTemplate}"` : <span className="text-zinc-700 italic">"No message set"</span>}
                  </p>
                </div>

                {alsoReplyComment && (
                  <div className="flex flex-col gap-1 bg-[#09090b]/40 rounded-lg p-2 border border-white/5">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Comment Reply:</span>
                    <p className="text-[10px] text-zinc-400 italic leading-4">
                      {commentReplyText.trim() ? `"${commentReplyText}"` : <span className="text-zinc-700 italic">"No reply set"</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pro tip */}
            <div className="border border-[#7f22fe]/10 bg-[#7f22fe]/5 rounded-xl p-4 flex gap-3 items-start text-xs leading-5">
              <Sparkles className="size-4.5 text-[#7f22fe] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 text-zinc-400">
                <span className="font-bold text-white">Pro Tip:</span>
                <span>Include links in your DM templates to automatically redirect users to your lead forms or products.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
