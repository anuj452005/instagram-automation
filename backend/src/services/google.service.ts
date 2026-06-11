import fs from 'fs';
import { google } from 'googleapis';
import { env } from '../config/env';

export class GoogleService {
  private static getOAuthClient() {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const redirectUri = env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) are not configured in environment variables.');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates the consent URL for the Google OAuth workflow
   */
  static getAuthUrl(): string {
    const oauth2Client = this.getOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  }

  /**
   * Exchanges an authorization code for access and refresh tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<any> {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Refreshes an access token using a refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<any> {
    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  }

  /**
   * Fetches user and channel profile details
   */
  static async getProfileDetails(accessToken: string): Promise<{ email: string; displayName: string; channelIconUrl: string; id: string }> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const profile = await oauth2.userinfo.get();
    
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    let channelIconUrl = '';
    let displayName = profile.data.name || '';
    let id = profile.data.id || '';

    try {
      const channelResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true,
      });

      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const channel = channelResponse.data.items[0];
        id = channel.id || id;
        displayName = channel.snippet?.title || displayName;
        channelIconUrl = channel.snippet?.thumbnails?.default?.url || '';
      }
    } catch (err) {
      console.warn('⚠️ [GoogleService.getProfileDetails] Could not fetch YouTube channel details, falling back to basic profile:', err);
    }

    return {
      id,
      email: profile.data.email || '',
      displayName,
      channelIconUrl,
    };
  }

  /**
   * Lists video files available in the user's Google Drive
   */
  static async listDriveVideos(accessToken: string): Promise<any[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      q: "mimeType contains 'video/' and trashed = false",
      fields: 'files(id, name, mimeType, size, thumbnailLink)',
      pageSize: 50,
    });

    return response.data.files || [];
  }

  /**
   * Downloads a file from Google Drive to a local destination path
   */
  static async downloadDriveFile(accessToken: string, fileId: string, destPath: string): Promise<void> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const writer = fs.createWriteStream(destPath);
    await new Promise<void>((resolve, reject) => {
      response.data
        .on('error', (err) => {
          writer.close();
          reject(err);
        })
        .pipe(writer);

      writer.on('finish', () => {
        resolve();
      });

      writer.on('error', (err) => {
        writer.close();
        reject(err);
      });
    });
  }

  /**
   * Uploads a local video file to YouTube, with option to schedule publishing
   */
  static async uploadToYouTube(
    accessToken: string,
    filePath: string,
    metadata: {
      title: string;
      description?: string;
      privacyStatus?: 'private' | 'public' | 'unlisted';
      scheduledPublishTime?: Date | string;
    }
  ): Promise<{ videoId: string; videoUrl: string }> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const privacy = metadata.privacyStatus || 'private';
    const requestBody: any = {
      snippet: {
        title: metadata.title,
        description: metadata.description || '',
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: privacy,
      },
    };

    if (metadata.scheduledPublishTime) {
      // Must be set as private for scheduling to work correctly in YouTube API
      requestBody.status.privacyStatus = 'private';
      requestBody.status.publishAt = new Date(metadata.scheduledPublishTime).toISOString();
    }

    console.log(`📤 [GoogleService.uploadToYouTube] Commencing upload for "${metadata.title}" (Status: ${requestBody.status.privacyStatus}, Scheduled: ${requestBody.status.publishAt || 'Immediately'})`);

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody,
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new Error('YouTube API upload succeeded but did not return a video ID.');
    }

    const videoUrl = `https://youtu.be/${videoId}`;
    console.log(`✅ [GoogleService.uploadToYouTube] Upload successful: ${videoUrl}`);

    return {
      videoId,
      videoUrl,
    };
  }
}
