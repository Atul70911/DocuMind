import { connectDB } from './lib/db.js';
import './workers/document.worker.js'; 

async function main() {
  await connectDB();
  console.log('🔧 Document worker started, listening for jobs...');
}

main();