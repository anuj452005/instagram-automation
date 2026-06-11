import app from './app';
import { env } from './config/env';
import './workers/comment.worker';
import './workers/dm-sender.worker';
import './workers/lead-processor.worker';
import './workers/analytics.worker';
import './workers/scheduler.worker';
import './workers/youtube.worker';
import { setupScheduledActivationJob } from './queues/scheduler.queue';

const port = env.PORT;

app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  
  // Register the repeatable activation schedule
  try {
    await setupScheduledActivationJob();
  } catch (err) {
    console.error('❌ Failed to register repeatable scheduled activations job:', err);
  }
});
