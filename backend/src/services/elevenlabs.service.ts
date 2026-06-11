import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export class ElevenLabsService {
  /**
   * Fetches available voices from ElevenLabs
   */
  static async getVoices(apiKey: string): Promise<any[]> {
    if (!apiKey) {
      throw new Error('ElevenLabs API Key is required.');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API returned status ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      return data.voices || [];
    } catch (error: any) {
      console.error('❌ [ElevenLabsService.getVoices] Failed to fetch voices:', error);
      throw new Error(error.message || 'Failed to fetch voices from ElevenLabs.');
    }
  }

  /**
   * Generates speech audio from text and saves it to a temp file
   * Returns the absolute path of the generated temp file
   */
  static async generateSpeech(apiKey: string, voiceId: string, text: string): Promise<string> {
    if (!apiKey) {
      throw new Error('ElevenLabs API Key is required.');
    }
    if (!voiceId) {
      throw new Error('Voice ID is required.');
    }
    if (!text) {
      throw new Error('Script text is required.');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API returned status ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a temporary directory for GramFlow YouTube automation
      const tempDir = path.join(os.tmpdir(), 'gramflow-youtube');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFileName = `speech-${Date.now()}-${crypto.randomUUID()}.mp3`;
      const tempFilePath = path.join(tempDir, tempFileName);

      fs.writeFileSync(tempFilePath, buffer);

      console.log(`✅ [ElevenLabsService.generateSpeech] Generated speech file saved at ${tempFilePath}`);
      return tempFilePath;
    } catch (error: any) {
      console.error('❌ [ElevenLabsService.generateSpeech] Failed to generate speech:', error);
      throw new Error(error.message || 'Failed to generate speech via ElevenLabs.');
    }
  }
}
