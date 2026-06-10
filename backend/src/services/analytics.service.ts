import { analyticsQueue } from '../queues/analytics.queue';

export type AnalyticsEventType = 'comment_received' | 'keyword_matched' | 'dm_sent' | 'dm_failed' | 'lead_collected';

export interface TrackEventPayload {
  instagramAccountId: string;
  automationId: string | null;
  eventType: AnalyticsEventType;
  payload?: any;
}

export class AnalyticsService {
  static async trackEvent(data: TrackEventPayload) {
    try {
      await analyticsQueue.add('track-event', data);
      console.log(`📊 [AnalyticsService] Queued event "${data.eventType}" for campaign: ${data.automationId || 'global'}`);
    } catch (error) {
      console.error(`❌ [AnalyticsService] Failed to queue event "${data.eventType}":`, error);
    }
  }
}
