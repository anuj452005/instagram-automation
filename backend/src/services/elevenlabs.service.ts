import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Splits text into chunks of maximum length while keeping words intact.
 */
function splitTextIntoChunks(text: string, maxLength: number = 200): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = (currentChunk + ' ' + word).trim();
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

export class ElevenLabsService {
  /**
   * Generates silent audio fallback using FFmpeg.
   */
  static async generateSilence(durationSeconds: number): Promise<string> {
    const tempDir = path.join(os.tmpdir(), 'gramflow-youtube');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `silence-${Date.now()}-${crypto.randomUUID()}.mp3`);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('anullsrc=channel_layout=mono:sample_rate=44100')
        .inputFormat('lavfi')
        .outputOptions([`-t ${durationSeconds}`, '-c:a libmp3lame', '-b:a 192k'])
        .output(tempFilePath)
        .on('end', () => {
          console.log(`✅ [ElevenLabsService.generateSilence] Generated silent audio fallback: ${tempFilePath}`);
          resolve(tempFilePath);
        })
        .on('error', (err) => {
          console.error(`❌ [ElevenLabsService.generateSilence] FFmpeg silence generation failed:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Generates free Google Translate TTS audio file.
   */
  static async generateGoogleTTS(text: string, language: string = 'en'): Promise<string> {
    const chunks = splitTextIntoChunks(text, 200);
    const buffers: Buffer[] = [];

    console.log(`🗣️ [ElevenLabsService.generateGoogleTTS] Generating Google TTS for ${chunks.length} chunks...`);

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${language}&client=tw-ob`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Google TTS API returned status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      buffers.push(Buffer.from(arrayBuffer));
    }

    const mergedBuffer = Buffer.concat(buffers);
    const tempDir = path.join(os.tmpdir(), 'gramflow-youtube');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `google-tts-${Date.now()}-${crypto.randomUUID()}.mp3`;
    const tempFilePath = path.join(tempDir, tempFileName);
    fs.writeFileSync(tempFilePath, mergedBuffer);

    console.log(`✅ [ElevenLabsService.generateGoogleTTS] Google TTS audio file saved at ${tempFilePath}`);
    return tempFilePath;
  }

  /**
   * Fetches available voices, appending the Free TTS Option.
   */
  static async getVoices(apiKey: string): Promise<any[]> {
    if (!apiKey) {
      throw new Error('ElevenLabs API Key is required.');
    }

    const freeVoiceOption = { voice_id: 'free_google_tts', name: 'Free TTS (Google Voice)' };

    if (apiKey === 'mock' || apiKey.toLowerCase() === 'mock_key') {
      return [
        freeVoiceOption,
        { voice_id: 'mock_voice_1', name: 'Mock Roger (Laid-Back)' },
        { voice_id: 'mock_voice_2', name: 'Mock Sarah (Mature)' },
        { voice_id: 'mock_voice_3', name: 'Mock Charlie (Deep)' },
      ];
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
      const voices = data.voices || [];

      // Prepend the Free Google TTS option
      return [freeVoiceOption, ...voices];
    } catch (error: any) {
      console.error('❌ [ElevenLabsService.getVoices] Failed to fetch voices:', error);
      // Fallback to free option and mock if ElevenLabs fails to fetch
      return [freeVoiceOption];
    }
  }

  /**
   * Generates speech audio from text and saves it to a temp file.
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

    // 1. Check if user explicitly selected the Free Google TTS voice
    if (voiceId === 'free_google_tts') {
      return this.generateGoogleTTS(text);
    }

    // 2. Handle mock mode
    if (apiKey === 'mock' || apiKey.toLowerCase() === 'mock_key' || voiceId.startsWith('mock_voice_')) {
      console.log('🤖 [ElevenLabsService.generateSpeech] Mock mode detected. Generating silence.');
      const estimatedDuration = Math.max(3, Math.ceil(text.length / 15));
      return this.generateSilence(estimatedDuration);
    }

    // 3. Normal ElevenLabs generation
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
          model_id: 'eleven_multilingual_v2',
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
