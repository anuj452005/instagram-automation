import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Send } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-[#09090b] flex flex-col justify-center items-center p-6 overflow-hidden font-sans">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.541_0.281_293.01/_0.15)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.696_0.17_162.48/_0.05)_0%,transparent_60%)] blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="z-10 flex flex-col items-center gap-3 mb-8">
        <div className="size-12 shadow-[0_0_30px_oklch(0.541_0.281_293.01/_0.6)] rounded-2xl bg-[#7f22fe] flex justify-center items-center">
          <Send className="size-6 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-bold text-2xl tracking-tight text-white">
            Gramflow
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Instagram Comment-to-DM Marketing Automation
          </p>
        </div>
      </div>

      {/* Clerk SignUp Interface Wrapper */}
      <div className="z-10 w-full max-w-[440px]">
        <SignUp
          path="/signup"
          routing="path"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full',
              card: 'bg-[#121214] border border-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8',
              headerTitle: 'text-white text-xl font-bold font-sans tracking-tight',
              headerSubtitle: 'text-zinc-400 text-sm font-sans',
              socialButtonsBlockButton: 'bg-[#1a1a1e] border border-white/5 hover:bg-[#222226] text-white transition-all duration-200 py-2.5 rounded-lg',
              socialButtonsBlockButtonText: 'text-white font-medium text-sm',
              socialButtonsProviderIcon__facebook: 'w-5 h-5',
              dividerRow: 'my-4',
              dividerText: 'text-zinc-500 text-xs font-medium uppercase tracking-wider',
              formFieldLabel: 'text-zinc-300 font-medium text-xs mb-1.5',
              formFieldInput: 'bg-[#1a1a1e] border border-white/5 text-white placeholder-zinc-600 focus:border-[#7f22fe]/40 focus:ring-1 focus:ring-[#7f22fe]/40 rounded-lg py-2.5 px-3 text-sm transition-all duration-200',
              formButtonPrimary: 'bg-[#7f22fe] hover:bg-[#9647ff] text-white font-medium text-sm py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-[#7f22fe]/20 active:scale-[0.98]',
              footerActionText: 'text-zinc-400 text-xs',
              footerActionLink: 'text-[#7f22fe] hover:text-[#9647ff] transition-all duration-200 font-semibold text-xs',
              identityPreviewText: 'text-white',
              identityPreviewEditButtonIcon: 'text-[#7f22fe] hover:text-[#9647ff]',
              otpCodeFieldInput: 'bg-[#1a1a1e] border border-white/5 text-white focus:border-[#7f22fe]/40 rounded-lg text-lg font-mono',
            },
          }}
        />
      </div>
    </div>
  );
};
