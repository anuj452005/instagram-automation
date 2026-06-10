import { env } from '../config/env';

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
    name: string;
    profile_picture_url?: string;
  };
}

export interface LinkableAccount {
  instagramAccountId: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  fbPageId: string;
  fbPageAccessToken: string;
}

export class MetaService {
  private static GRAPH_API_URL = 'https://graph.facebook.com/v20.0';

  /**
   * Exchanges a short-lived Facebook User Access Token for a long-lived User Access Token (valid for 60 days).
   */
  static async getLongLivedUserToken(shortLivedToken: string): Promise<string> {
    const appId = env.META_APP_ID;
    const appSecret = env.META_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('Meta App ID or App Secret is not configured.');
    }

    const url = `${this.GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error(`Failed to exchange Meta user token: ${JSON.stringify(errPayload)}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  /**
   * Fetches Facebook Pages and connected Instagram Business accounts managed by the user.
   */
  static async fetchUserPages(userAccessToken: string): Promise<MetaPage[]> {
    const fields = 'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}';
    const url = `${this.GRAPH_API_URL}/me/accounts?fields=${fields}&access_token=${userAccessToken}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch Facebook Pages: ${JSON.stringify(errPayload)}`);
    }

    const data = (await response.json()) as { data: MetaPage[] };
    return data.data || [];
  }

  /**
   * Retrieves linkable accounts. Performs the long-lived token exchange and queries Meta Pages.
   * If MOCK_META_API is active, returns mock accounts immediately.
   */
  static async getLinkableAccounts(fbUserAccessToken: string): Promise<LinkableAccount[]> {
    if (env.MOCK_META_API) {
      return this.getMockLinkableAccounts();
    }

    try {
      // Step 1: Exchange user token for a long-lived user token
      let longLivedUserToken = fbUserAccessToken;
      try {
        longLivedUserToken = await this.getLongLivedUserToken(fbUserAccessToken);
      } catch (err) {
        console.warn('⚠️ Token exchange failed, proceeding with short-lived token:', err);
      }

      // Step 2: Fetch pages (which will contain long-lived Page Access Tokens)
      const pages = await this.fetchUserPages(longLivedUserToken);

      const linkable: LinkableAccount[] = [];

      for (const page of pages) {
        if (page.instagram_business_account) {
          linkable.push({
            instagramAccountId: page.instagram_business_account.id,
            username: page.instagram_business_account.username,
            name: page.instagram_business_account.name || page.instagram_business_account.username,
            profilePictureUrl: page.instagram_business_account.profile_picture_url || '',
            fbPageId: page.id,
            fbPageAccessToken: page.access_token,
          });
        }
      }

      return linkable;
    } catch (error: any) {
      console.error('❌ Error fetching from Meta API:', error);
      throw error;
    }
  }

  private static getMockLinkableAccounts(): LinkableAccount[] {
    return [
      {
        instagramAccountId: 'ig_mock_1',
        username: 'mock_creator_one',
        name: 'Mock Creator One',
        profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        fbPageId: 'page_mock_1',
        fbPageAccessToken: 'mock_page_access_token_1',
      },
      {
        instagramAccountId: 'ig_mock_2',
        username: 'mock_creator_two',
        name: 'Mock Creator Two',
        profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        fbPageId: 'page_mock_2',
        fbPageAccessToken: 'mock_page_access_token_2',
      },
    ];
  }
}
