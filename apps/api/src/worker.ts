import { connectDB } from './lib/db.js';
import { documentWorker } from './workers/document.worker.js';

async function main() {
  await connectDB();
  console.log('🔧 Document worker started, listening for jobs...');
}

main();

async function shutdown(signal: string) {
  console.log(`\n${signal} received — finishing current job before exit...`);
  await documentWorker.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));