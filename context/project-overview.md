# Project Overview: Instagram Comment-to-DM Automation SaaS

## Overview

This application is a multi-tenant Instagram Comment-to-DM Automation Software-as-a-Service (SaaS) designed specifically for Indian creators, influencers, coaches, educators, recruiters, and small-to-medium businesses (SMBs). It solves the problem of manual follower engagement and low conversion rates on organic content by automatically sending a direct message (DM) within seconds of a follower commenting a trigger keyword on a post or reel. The system facilitates conversational lead generation (email and phone capture) natively inside the DM interface or via hosted, mobile-responsive landing pages, empowering creators to build subscriber databases, deliver digital assets, and monetize their reach efficiently.

## Goals

1. **Sub-10-Second Response Delivery**: Guarantee that automated direct messages are dispatched to commenters within 10 seconds of their comment being posted, under normal network conditions.
2. **Native Conversational Lead Capture**: Enable creators to collect and validate follower contact information (specifically emails and Indian phone numbers) directly inside Instagram DMs without external form tools.
3. **Publication-Synchronized Scheduling**: Provide a key differentiator allowing creators to schedule automation rules to go live at a precise date and time, synchronized with their content publishing schedule.
4. **Cost-Effective, Scale-to-Zero Infrastructure**: Maintain baseline cloud hosting costs under ₹2,000/month for up to 200 active creators by leveraging Azure Container Apps (ACA) with scale-to-zero capabilities and PostgreSQL.
5. **INR-Native Subscription Payments**: Implement recurring subscription billing supporting Indian payment instruments (UPI auto-pay and domestic credit/debit cards) via Razorpay.

## Core User Flow

1. **Authentication**: The creator registers or signs in to the web dashboard using Facebook Login via Clerk Auth.
2. **Account Linking**: The creator connects the Facebook Page associated with their Instagram Professional or Business account; the system retrieves and securely encrypts their Page Access Token using AES-256-GCM.
3. **Automation Configuration**: The creator configures an automation rule in the builder: naming the campaign, selecting keywords (exact, contains, or starts-with matching), choosing a DM template, and configuring lead capture settings (email/phone).
4. **Scheduled or Immediate Activation**: The creator schedules the automation for a future date/time or activates it immediately, setting its state to `active`.
5. **Comment Ingest & Deduplication**: A follower comments the trigger word on a post or reel. Meta sends a webhook event which is verified via HMAC-SHA256, deduplicated in Redis, and pushed to the `comment-ingest` BullMQ queue.
6. **Automation Matching**: The `comment-ingest` worker parses the comment, matches it against active rules for that post, checks user subscription limits, and enqueues a `dm-sender` job.
7. **Rate-Limited DM Delivery**: The `dm-sender` worker throttles execution to 1 message per 2 seconds per account (30 DMs/min) with human-like jitter, verifies the safety cap of 195 DMs/hour is not exceeded, and dispatches the DM via the Meta Graph API.
8. **Interactive Lead Capture**: If lead capture is active, a Redis-backed multi-step DM conversation is initiated. The system prompts the follower for their email and phone, validates responses using regex, inserts them into the `leads` table, and delivers the final asset link.
9. **Dashboard Monitoring**: The creator views campaign conversion metrics (total comments, keywords matched, DMs sent, leads captured) and logs in real-time.

## Features

### Authentication & Account Management
- Seamless signup/login using Clerk Auth (Facebook Social Connection).
- Discovered accounts page showing linkable Instagram Professional accounts.
- Daily cron job to refresh long-lived Page Access Tokens (45-day cycle).
- Secure AES-256-GCM encryption of access tokens at rest.

### Automation Engine & Keyword Matcher
- CRUD builder for Global (all posts/reels) or Post-Specific automation rules.
- Keyword engine matching `exact`, `contains`, and `starts_with` text structures.
- Support for emojis, multilingual inputs (Hindi/English), and common trailing punctuation.
- Double-engagement option: post a public comment reply (e.g. "Check your DMs! 📩") in addition to sending the DM.

### Webhook Ingest & Queue Management
- Secure webhook receiver verifying Meta's `x-hub-signature-256` signature using raw body timing-safe checks.
- Redis-based event deduplication with a 24-hour TTL window.
- bullMQ-based processing pipeline featuring `comment-ingest`, `dm-sender`, `lead-processor`, and `scheduled-jobs` queues.
- Recovery cron to re-enqueue failed webhook events after temporary infrastructure outages.

### Conversational Lead Capturing
- Multi-step, interactive DM conversation flows managed via Redis sessions (1-hour TTL).
- Regex-based verification for email syntax and 10-digit Indian phone numbers (accepting +91 formats).
- Fallback public mobile-responsive landing pages hosted at `/l/:token` with manual input forms.
- Searchable leads manager dashboard with CSV download capabilities for Creator and Pro plans.

### Analytics & Audit Logs
- Real-time aggregation showing DMs sent, failed, success rate, and daily line charts.
- Campaign-specific keyword performance breakdown.
- Burst traffic monitor displaying visual banners when queue sizes exceed 100 jobs.
- Append-only `audit_logs` table tracking system events, admin changes, and creator operations.

### Billing & Subscription Management
- Razorpay subscription flow supporting card mandates and UPI auto-pay subscriptions in INR.
- Dynamic subscription tiers middleware restricting linked accounts, active automations, and DMs/month.
- 3-day grace period flow for failed subscription renewals (`past_due`) before account access is suspended.

### Ops & System Administration
- Secure admin panel showing system-wide statistics (MRR, total users, error rate, queue depths).
- Embedded Bull Board queue explorer at `/admin/queues` for manual retry of failed jobs.
- Raw webhook event log inspector for customer support troubleshooting.

## Scope

### In Scope
- Clerk Authentication integrated with Facebook login.
- Linking multiple Instagram Business/Professional accounts based on subscription tier.
- Automation CRUD (keywords, template messaging, activation state).
- Sub-10-second DM sending triggered by keyword comments.
- Concurrency and rate limit enforcement (30 DMs/min per account, 195 DMs/hr hard cap).
- Deduplication (ensuring a commenter receives a campaign DM only once).
- Native conversational lead collection (emails and Indian phone numbers) via DM.
- Auto-generated mobile-responsive lead capture landing pages at `/l/:token`.
- Razorpay subscription integration (recurring cards + UPI auto-pay).
- Storing and exporting collected leads to CSV.
- Admin dashboard and Bull Board queue administration tool.
- Pinpoint application monitoring (liveness checks, API rate limiting, exception alerts).

### Out of Scope
- AI-personalized DM generation (dynamic chatbot text generation using LLMs).
- Messaging channels outside Meta (no WhatsApp, SMS, or direct Email newsletters).
- Comment moderation services (deleting comments, hiding spam, auto-flagging abuse).
- Multi-user agency workspaces (teams sharing login access to a single account).
- Direct third-party CRM sync integrations (Zapier, HubSpot, Google Sheets) in the MVP.
- Story poll reactions, story mentions, or emoji-only triggers (only comments on feed posts and reels are supported).

## Success Criteria

1. **Successful Onboarding**: A new user can log in via Clerk/Facebook, view and connect an Instagram account, and save a draft automation campaign.
2. **Timely Processing**: Matched comments trigger a DM delivery within 10 seconds of the comment being posted in a sandbox or production environment.
3. **Deduplication Enforcement**: A follower posting the same keyword multiple times on a post triggers only a single DM job, preventing spam bans.
4. **Rate Limit Conformance**: Enqueuing 250 comment events concurrently executes them sequentially at the configured rate of 30 DMs/min, delaying the rest in Redis without Meta rejecting requests due to rate limits.
5. **Accurate Lead Insertion**: Followers replying to lead capture DMs have their email and phone validated, parsed, and saved to the `leads` table, while invalid formats trigger a polite retry prompt.
6. **Real-time Metrics**: The frontend dashboard accurately updates DMs sent, keyword triggers, and collected leads within 2 seconds of worker execution.
7. **Secure Verification**: Webhook requests with incorrect signatures return a 403 Forbidden immediately, and valid webhooks respond with a 200 OK within 200ms.
8. **Plan Quota Interception**: Creators reaching their monthly DM quota limits (e.g. 200/month for free tier) are blocked from enqueuing new DM jobs and receive upgrading prompts in the UI.
