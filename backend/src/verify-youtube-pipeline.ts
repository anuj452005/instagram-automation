import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { VideoProcessorService } from './services/video-processor.service';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function runVerification() {
  console.log('🧪 Starting YouTube Shorts video pipeline verification...');

  const tempDir = path.join(os.tmpdir(), 'gramflow-youtube-test');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const dummyVideoPath = path.join(tempDir, 'dummy_input_video.mp4');
  const dummyAudioPath = path.join(tempDir, 'dummy_input_audio.wav');
  const outputPath = path.join(tempDir, 'merged_output_short.mp4');

  // Clean up any old test files
  for (const f of [dummyVideoPath, dummyAudioPath, outputPath]) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  }

  try {
    // 1. Generate 5-second landscape test video (640x480) using lavfi testsrc
    console.log('🎥 Generating a 5-second landscape video...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input('testsrc=duration=5:size=640x480:rate=25')
        .inputFormat('lavfi')
        .outputOptions(['-c:v libx264', '-pix_fmt yuv420p'])
        .output(dummyVideoPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
    console.log(`✅ Generated dummy video at: ${dummyVideoPath}`);

    // 2. Generate 3-second audio tone using lavfi sine
    console.log('🔊 Generating a 3-second audio tone...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input('sine=frequency=440:duration=3')
        .inputFormat('lavfi')
        .output(dummyAudioPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
    console.log(`✅ Generated dummy audio at: ${dummyAudioPath}`);

    // 3. Execute VideoProcessorService.mergeAudioVideo
    console.log('⚡ Merging audio & video into vertical 9:16 Short (should be 3 seconds)...');
    const resultPath = await VideoProcessorService.mergeAudioVideo(dummyVideoPath, dummyAudioPath, outputPath);
    console.log(`✅ Merge completed! Output saved to: ${resultPath}`);

    // 4. Verify output file properties
    if (!fs.existsSync(outputPath)) {
      throw new Error('Verification failed: Output file does not exist.');
    }

    const stats = fs.statSync(outputPath);
    console.log(`📊 Output File Size: ${(stats.size / 1024).toFixed(2)} KB`);
    if (stats.size === 0) {
      throw new Error('Verification failed: Output file size is 0 bytes.');
    }

    // Inspect output dimensions and duration
    await new Promise<void>((resolve, reject) => {
      ffmpeg.ffprobe(outputPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        console.log(`🎬 Video dimensions: ${videoStream?.width}x${videoStream?.height}`);
        console.log(`⏱️ Duration: ${metadata.format.duration}s`);
        console.log(`🎵 Audio codec: ${audioStream?.codec_name}`);

        if (videoStream?.width !== 1080 || videoStream?.height !== 1920) {
          reject(new Error(`Verification failed: Expected 1080x1920 resolution, got ${videoStream?.width}x${videoStream?.height}`));
          return;
        }

        const duration = parseFloat(metadata.format.duration?.toString() || '0');
        // Accept slight float variations (e.g. 3.0 or 2.98)
        if (duration < 2.8 || duration > 3.2) {
          reject(new Error(`Verification failed: Expected output duration ~3s, got ${duration}s`));
          return;
        }

        resolve();
      });
    });

    console.log('🎉 [Pipeline Verification] Success! FFmpeg scaled to 9:16 and mapped audio correctly.');
  } catch (error: any) {
    console.error('❌ [Pipeline Verification] Failed:', error);
    process.exit(1);
  } finally {
    // Clean up temporary test files
    console.log('🧹 Cleaning up test files...');
    for (const f of [dummyVideoPath, dummyAudioPath, outputPath]) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (err) {
          console.warn(`Could not delete test file ${f}:`, err);
        }
      }
    }
  }
}

runVerification();
