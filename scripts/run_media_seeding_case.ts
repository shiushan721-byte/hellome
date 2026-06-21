import 'dotenv/config';
import { createUgcTask, getUgcTask, confirmUgcTask } from '../src/server/ugcTaskService';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const task = await createUgcTask({
    userExternalId: 'creator@hellome.ai',
    workspaceName: 'Creator Studio',
    input: {
      skillId: 'media-seeding',
      sellingPoint: '轻薄防晒，通勤一整天也不闷，补喷也不花妆。',
      platform: '抖音',
      effectGoal: '更像真人种草',
      referenceUrl: 'https://example.com/media-seeding-showcase',
    },
  });
  console.log('CREATED', task.id, task.status);

  for (let i = 0; i < 20; i += 1) {
    await sleep(800);
    const current = await getUgcTask(task.id);
    console.log('POLL', i, current?.status, current?.recoveryState?.runState, current?.events?.at(-1)?.message);
    if (current?.status === 'waiting_confirmation') {
      const confirmed = await confirmUgcTask(task.id);
      console.log('CONFIRMED', confirmed?.status);
      break;
    }
  }

  for (let i = 0; i < 180; i += 1) {
    await sleep(2000);
    const current = await getUgcTask(task.id);
    console.log('RENDER', i, current?.status, current?.events?.at(-1)?.message);
    if (!current) break;
    if (current.status === 'completed' || current.status === 'failed' || current.status === 'cancelled') {
      console.log('FINAL', JSON.stringify(current, null, 2));
      break;
    }
  }
}

main().catch((error) => {
  console.error('RUN_FAILED', error);
  process.exit(1);
});
