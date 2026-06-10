import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface CampaignMetadata {
  id: string;
  name: string;
  collectLeads: boolean;
  leadFields: string[];
  instagramAccountId: string;
}

export const PublicLeadPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  // State for form values
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Fetch campaign metadata
  const { data: campaign, isLoading, error } = useQuery<CampaignMetadata>({
    queryKey: ['publicCampaign', token],
    queryFn: async () => {
      const response = await api.get(`/api/public/campaigns/${token}`);
      return response.data;
    },
    retry: false,
    enabled: !!token,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setValidationErrors([]);
    setGeneralError(null);

    try {
      const payload = {
        landingPageToken: token,
        email: campaign?.leadFields.includes('email') ? formData.email : undefined,
        phone: campaign?.leadFields.includes('phone') ? formData.phone : undefined,
        fullName: campaign?.leadFields.includes('fullName') ? formData.fullName : undefined,
      };

      const response = await api.post('/api/public/leads/submit', payload);

      if (response.data?.success) {
        setSubmitSuccess(true);
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errorData = err.response.data;
        if (errorData.errors) {
          setValidationErrors(errorData.errors);
        } else if (errorData.error) {
          setGeneralError(errorData.error);
        }
      } else {
        setGeneralError('Something went wrong. Please check your internet connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center gap-4 text-[#fafafa] font-sans">
        <Loader2 className="size-10 text-[#7f22fe] animate-spin" />
        <span className="text-zinc-500 text-sm animate-pulse">Loading campaign options...</span>
      </div>
    );
  }

  // Render Error state (Campaign not found/inactive)
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-6 text-center font-sans text-[#fafafa]">
        <div className="max-w-md bg-[#121214] border border-white/5 p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
          <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-lg">
            ⚠️
          </div>
          <h2 className="font-semibold text-lg text-white">Campaign Unavailable</h2>
          <p className="text-zinc-400 text-sm leading-5">
            This lead capture link is invalid, expired, or the automation campaign has been deactivated by the creator.
          </p>
        </div>
      </div>
    );
  }

  const fields = campaign.leadFields || ['email'];

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-6 font-sans text-[#fafafa] relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(127,34,254,0.05)_1px,transparent_1px)] bg-[size:24px_24px]">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-[#7f22fe]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 size-72 rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-[linear-gradient(160deg,#121214,rgba(18,18,20,0.8))] backdrop-blur-2xl rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Colorful top bar indicator */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7f22fe] to-pink-500" />

        {/* Success View */}
        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-6 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="font-semibold text-2xl text-white mb-3 tracking-tight">Submission Confirmed!</h2>
            <p className="text-zinc-400 text-sm leading-5 max-w-xs mb-6">
              Thank you for submitting your details. We have captured your contact info successfully and sent your resources!
            </p>
            <span className="text-xs text-zinc-600 flex items-center gap-1.5 bg-zinc-900 px-3.5 py-1.5 rounded-full border border-white/5">
              <Sparkles className="size-3 text-[#7f22fe]" /> Powered by GramFlow
            </span>
          </div>
        ) : (
          /* Form View */
          <div className="flex flex-col gap-6">
            
            {/* Header info */}
            <div className="flex flex-col gap-1.5 text-center">
              <div className="size-10 rounded-xl bg-[#7f22fe]/10 border border-[#7f22fe]/30 flex items-center justify-center text-[#7f22fe] mx-auto mb-2 shadow-xl">
                <Send className="size-4" />
              </div>
              <h1 className="font-semibold text-xl leading-7 text-white tracking-tight">
                {campaign.name}
              </h1>
              <p className="text-zinc-400 text-xs leading-4">
                Please complete the form below to receive your download link.
              </p>
            </div>

            {/* Error notifications */}
            {generalError && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 text-red-400 text-xs leading-4 align-top">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex flex-col gap-1.5 text-red-400 text-xs leading-4">
                <div className="flex gap-2 font-medium items-center mb-1">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Validation Errors</span>
                </div>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Form element */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Full Name Field */}
              {fields.includes('fullName') && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-zinc-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full rounded-xl bg-zinc-900 border border-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#7f22fe]/50 focus:shadow-[0_0_12px_rgba(127,34,254,0.1)] transition-all"
                  />
                </div>
              )}

              {/* Email Field */}
              {fields.includes('email') && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-zinc-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="follower@email.com"
                    className="w-full rounded-xl bg-zinc-900 border border-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#7f22fe]/50 focus:shadow-[0_0_12px_rgba(127,34,254,0.1)] transition-all"
                  />
                </div>
              )}

              {/* Phone Field */}
              {fields.includes('phone') && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-zinc-400">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl bg-zinc-900 border border-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#7f22fe]/50 focus:shadow-[0_0_12px_rgba(127,34,254,0.1)] transition-all"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] disabled:opacity-50 text-white font-semibold text-sm py-3 flex items-center justify-center gap-2 mt-2 transition-all shadow-lg shadow-[#7f22fe]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Get Resource
                    <Send className="size-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
