// src/renderer/services/idleDetectionService.ts
import { timerService } from './timerService';

export class IdleDetectionService {
  private isSystemLocked = false;
  private lockCallbacks: (() => void)[] = [];
  private unlockCallbacks: (() => void)[] = [];
  private resetTimerCallbacks: (() => void)[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for system lock events from main process
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('system:locked', () => {
        console.log('[IdleDetectionService] System locked');
        this.isSystemLocked = true;
        this.lockCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('[IdleDetectionService] Error in lock callback:', error);
          }
        });
      });

      window.electron.ipcRenderer.on('system:unlocked', () => {
        console.log('[IdleDetectionService] System unlocked');
        this.isSystemLocked = false;
        this.unlockCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('[IdleDetectionService] Error in unlock callback:', error);
          }
        });
      });

      // Handle smart pause timer reset
      window.electron.ipcRenderer.on('smart-pause:reset-timer', () => {
        console.log('[IdleDetectionService] Received smart pause reset signal');
        timerService.resetDueToSystemResume();
        this.resetTimerCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('[IdleDetectionService] Error in reset timer callback:', error);
          }
        });
      });

      // Listen for smart pause settings changes
      window.electron.ipcRenderer.on('smart-pause:enabled-changed', (enabled: boolean) => {
        console.log('[IdleDetectionService] Smart pause enabled changed:', enabled);
      });

      window.electron.ipcRenderer.on('smart-pause:threshold-changed', (threshold: number) => {
        console.log('[IdleDetectionService] Smart pause threshold changed:', threshold);
      });
    }
  }

  isLocked(): boolean {
    return this.isSystemLocked;
  }

  onLock(callback: () => void): void {
    this.lockCallbacks.push(callback);
  }

  onUnlock(callback: () => void): void {
    this.unlockCallbacks.push(callback);
  }

  onResetTimer(callback: () => void): void {
    this.resetTimerCallbacks.push(callback);
  }

  removeAllCallbacks(): void {
    this.lockCallbacks = [];
    this.unlockCallbacks = [];
    this.resetTimerCallbacks = [];
  }

  async isSmartPauseEnabled(): Promise<boolean> {
    if (window.api?.smartPause) {
      return await window.api.smartPause.isEnabled();
    }
    return true;
  }

  async setSmartPauseEnabled(enabled: boolean): Promise<boolean> {
    if (window.api?.smartPause) {
      const result = await window.api.smartPause.setEnabled(enabled);
      return result.success;
    }
    return false;
  }

  async getSmartPauseThreshold(): Promise<number> {
    if (window.api?.smartPause) {
      return await window.api.smartPause.getThreshold();
    }
    return 5;
  }

  async setSmartPauseThreshold(threshold: number): Promise<boolean> {
    if (window.api?.smartPause) {
      const result = await window.api.smartPause.setThreshold(threshold);
      return result.success;
    }
    return false;
  }
}

export const idleDetectionService = new IdleDetectionService();
