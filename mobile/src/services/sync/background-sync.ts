import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getSyncManager } from './sync-manager';

const TASK_NAME = 'feelsync-biometrics-sync';

// Must be defined at module level (outside any component or function)
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await getSyncManager().syncNow();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60, // 1 hour in seconds
    });
  } catch {
    // Task already registered or not supported
  }
}
