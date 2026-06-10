import { redis } from '../config/redis';

export interface LeadSession {
  automationId: string;
  instagramAccountId: string;
  igUserId: string;
  igUsername?: string | null;
  currentFieldIndex: number;
  fieldsToCollect: string[];
  collectedData: Record<string, string>;
  sourceComment: string;
  sourceDmJobId: string;
}

export class LeadSessionService {
  private static SESSION_TTL = 3600; // 1 hour in seconds
  private static KEY_PREFIX = 'lead_session:';

  private static getKey(igUserId: string): string {
    return `${this.KEY_PREFIX}${igUserId}`;
  }

  /**
   * Creates or overwrites a lead session with a 1-hour TTL.
   */
  static async createSession(igUserId: string, session: LeadSession): Promise<void> {
    const key = this.getKey(igUserId);
    await redis.set(key, JSON.stringify(session), 'EX', this.SESSION_TTL);
  }

  /**
   * Retrieves the active lead session for a user, if any.
   */
  static async getSession(igUserId: string): Promise<LeadSession | null> {
    const key = this.getKey(igUserId);
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as LeadSession;
    } catch (err) {
      console.error(`❌ Failed to parse lead session for ${igUserId}:`, err);
      return null;
    }
  }

  /**
   * Updates an existing session by merging partial fields and resetting the 1-hour TTL.
   */
  static async updateSession(igUserId: string, updates: Partial<LeadSession>): Promise<void> {
    const session = await this.getSession(igUserId);
    if (!session) return;
    const updatedSession = { ...session, ...updates };
    await this.createSession(igUserId, updatedSession);
  }

  /**
   * Deletes a lead session (e.g. when completed or expired).
   */
  static async deleteSession(igUserId: string): Promise<void> {
    const key = this.getKey(igUserId);
    await redis.del(key);
  }
}
