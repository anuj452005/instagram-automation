import app from './app';
import { env } from './config/env';
import './workers/comment.worker';

const port = env.PORT;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});
