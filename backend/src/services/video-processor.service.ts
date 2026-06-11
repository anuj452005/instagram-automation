import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Set path to static FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class VideoProcessorService {
  /**
   * Merges a background video from Google Drive and a voiceover audio from ElevenLabs.
   * - Crops & Scales to vertical 9:16 (1080x1920)
   * - Loops background video if it is shorter than the audio
   * - Overlays/replaces original audio track with the voiceover
   * - Cuts precisely when the voiceover ends
   */
  static async mergeAudioVideo(videoPath: string, audioPath: string, outputPath: string): Promise<string> {
    console.log(`🎬 [VideoProcessorService.mergeAudioVideo] Processing video merge:
      - Video Input: ${videoPath}
      - Audio Input: ${audioPath}
      - Output Path: ${outputPath}`);

    return new Promise<string>((resolve, reject) => {
      // Find exact audio duration using ffprobe
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          return reject(new Error(`Failed to read audio duration: ${err.message}`));
        }

        const audioDuration = parseFloat(metadata.format.duration?.toString() || '0');
        console.log(`⏱️ [VideoProcessorService.mergeAudioVideo] Enforcing output duration: ${audioDuration} seconds`);

        ffmpeg()
          .input(videoPath)
          .inputOptions('-stream_loop -1') // Loop video infinitely so it covers long voiceovers
          .input(audioPath)
          .complexFilter([
            {
              filter: 'crop',
              options: {
                w: 'min(iw,ih*9/16)',
                h: 'min(ih,iw*16/9)',
              },
              inputs: '0:v',
              outputs: 'cropped',
            },
            {
              filter: 'scale',
              options: {
                w: 1080,
                h: 1920,
              },
              inputs: 'cropped',
              outputs: 'scaled',
            },
          ])
          .outputOptions([
            '-map [scaled]', // Use cropped and scaled video stream
            '-map 1:a:0',    // Use the audio stream from the second input
            `-t ${audioDuration}`, // Cut the output video precisely when the voiceover audio ends
            '-c:v libx264',  // Use H.264 video codec
            '-pix_fmt yuv420p', // Use YUV420p pixel format for maximum compatibility
            '-c:a aac',      // Use AAC audio codec
            '-b:a 192k',     // Audio bitrate
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log(`🚀 [VideoProcessorService] Spawned FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`⏳ [VideoProcessorService] Merging progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log(`✅ [VideoProcessorService] Merge completed successfully: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (ffmpegErr) => {
            console.error(`❌ [VideoProcessorService] FFmpeg processing error:`, ffmpegErr);
            reject(new Error(`FFmpeg merge failed: ${ffmpegErr.message}`));
          })
          .run();
      });
    });
  }
}
