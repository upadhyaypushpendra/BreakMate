// src/renderer/services/timerService.ts
import { TimerState } from '../stores/timer';
import { timerState, timerSettings } from '../stores/timer';
import { get } from 'svelte/store';

export class BreakTimerManager {
  private isBreakActive = false;
  private currentBreakDuration = 0;
  private breakStartTime = 0;
  private breakBroadcastInterval: NodeJS.Timeout | null = null;
  private updateCallbacks: ((remaining: number) => void)[] = [];
  private completeCallbacks: (() => void)[] = [];

  startBreakTimer(duration: number) {
    this.isBreakActive = true;
    this.currentBreakDuration = duration;
    this.breakStartTime = Date.now();

    if (this.breakBroadcastInterval) {
      clearInterval(this.breakBroadcastInterval);
    }

    this.breakBroadcastInterval = setInterval(() => {
      this.broadcastBreakTimer();
    }, 100); // Update every 100ms for smooth display

    console.log(`[BreakTimerManager] Started break timer for ${duration}s`);
  }

  stopBreakTimer() {
    if (!this.isBreakActive) {
      console.log('[BreakTimerManager] stopBreakTimer called but break not active, skipping');
      return;
    }

    this.isBreakActive = false;
    this.currentBreakDuration = 0;
    this.breakStartTime = 0;

    if (this.breakBroadcastInterval) {
      clearInterval(this.breakBroadcastInterval);
      this.breakBroadcastInterval = null;
    }

    console.log('[BreakTimerManager] Stopped break timer');
  }

  getBreakTimeRemaining(): number {
    if (!this.isBreakActive || this.breakStartTime === 0) {
      return this.currentBreakDuration;
    }

    const elapsed = Math.floor((Date.now() - this.breakStartTime) / 1000);
    const remaining = Math.max(0, this.currentBreakDuration - elapsed);
    return remaining;
  }

  isActive(): boolean {
    return this.isBreakActive;
  }

  onTimerUpdate(callback: (remaining: number) => void) {
    this.updateCallbacks.push(callback);
  }

  onTimerComplete(callback: () => void) {
    this.completeCallbacks.push(callback);
  }

  removeAllCallbacks() {
    this.updateCallbacks = [];
    this.completeCallbacks = [];
  }

  private broadcastBreakTimer() {
    const remaining = this.getBreakTimeRemaining();

    // Notify all registered callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback(remaining);
      } catch (error) {
        console.error('[BreakTimerManager] Error in timer update callback:', error);
      }
    });

    // Stop broadcasting when time is up
    if (remaining <= 0) {
      if (this.breakBroadcastInterval) {
        clearInterval(this.breakBroadcastInterval);
        this.breakBroadcastInterval = null;
      }

      // Notify completion callbacks
      this.completeCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('[BreakTimerManager] Error in timer complete callback:', error);
        }
      });
    }
  }
}

export class TimerService {
  private intervalId: NodeJS.Timeout | null = null;
  private timerStartTime = 0;
  private timerDuration = 0;
  public breakTimerManager = new BreakTimerManager();

  start() {
    const state = get<TimerState>(timerState);
    console.log(`[TimerService] Starting timer, isRunning:`, state.isRunning, 'intervalId:', this.intervalId);

    // Check both state and interval to prevent duplicate starts
    if (state.isRunning || this.intervalId !== null) {
      console.log('[TimerService] Timer already running, ignoring start request');
      return;
    }

    console.log('[TimerService] Starting timer with', state.timeRemaining, 'seconds remaining');
    timerState.update((s: TimerState) => ({ ...s, isRunning: true }));

    // Use system time instead of interval counting
    this.timerStartTime = Date.now();
    this.timerDuration = state.timeRemaining;

    this.intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.timerStartTime) / 1000);
      const remaining = Math.max(0, this.timerDuration - elapsed);

      timerState.update((state: TimerState) => {
        if (remaining > 0) {
          return { ...state, timeRemaining: remaining };
        } else {
          // Timer reached zero
          this.handleTimerComplete();
          return state;
        }
      });
    }, 100); // Check every 100ms for more accuracy
  }

  pause() {
    console.log('[TimerService] Pausing timer');
    timerState.update((s) => ({ ...s, isRunning: false }));
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.timerStartTime = 0;
    this.timerDuration = 0;
  }

  reset() {
    this.pause();
    const settings = get(timerSettings);
    const state = get(timerState);
    const newDuration = state.isOnBreak
      ? settings.breakDuration
      : settings.workDuration * 60;

    timerState.update((s) => ({
      ...s,
      timeRemaining: newDuration,
      isRunning: false
    }));
  }

  private handleTimerComplete() {
    this.pause();
    const state = get(timerState);
    const settings = get(timerSettings);

    // Determine next state
    const wasOnBreak = state.isOnBreak;
    const nextIsOnBreak = !wasOnBreak;

    const newCycleCount = wasOnBreak ? state.cycleCount : state.cycleCount + 1;
    const newBreaksTaken = wasOnBreak ? state.totalBreaksTaken + 1 : state.totalBreaksTaken;

    // Send notification to main process
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('timer:complete', {
        isOnBreak: nextIsOnBreak
      });
    }

    // Calculate new duration
    const newDuration = nextIsOnBreak
      ? settings.breakDuration
      : settings.workDuration * 60;

    // Update state
    timerState.update((s) => ({
      ...s,
      isRunning: false,
      isOnBreak: nextIsOnBreak,
      timeRemaining: newDuration,
      cycleCount: newCycleCount,
      totalBreaksTaken: newBreaksTaken
    }));

    if (!nextIsOnBreak) {
      setTimeout(() => this.start(), 500);
    }
  }

  skipBreak() {
    const settings = get(timerSettings);
    timerState.update((s) => ({
      ...s,
      isOnBreak: false,
      isRunning: false,
      timeRemaining: settings.workDuration * 60,
      totalBreaksTaken: s.totalBreaksTaken + 1
    }));

    setTimeout(() => this.start(), 500);
  }

  snoozeBreak() {
    // Set timer for 5 minutes snooze (300 seconds)
    const SNOOZE_DURATION_SECONDS = 5 * 60;

    timerState.update((s) => ({
      ...s,
      timeRemaining: SNOOZE_DURATION_SECONDS,
      isOnBreak: false,
      isRunning: false
    }));

    setTimeout(() => this.start(), 500);
  }

  completeBreak() {
    console.log('[TimerService] Break completed, transitioning to work');
    const settings = get(timerSettings);

    timerState.update((s) => ({
      ...s,
      isOnBreak: false,
      isRunning: false,
      timeRemaining: settings.workDuration * 60,
      totalBreaksTaken: s.totalBreaksTaken + 1
    }));

    setTimeout(() => this.start(), 500);
  }

  resetDueToSystemResume() {
    console.log('[TimerService] Resetting timer due to system resume after prolonged lock');

    // First, completely stop any running timer
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.timerStartTime = 0;
    this.timerDuration = 0;

    const settings = get(timerSettings);

    // Reset to full work duration and mark as not running
    timerState.update((s) => ({
      ...s,
      isOnBreak: false,
      isRunning: false,
      timeRemaining: settings.workDuration * 60
    }));

    // Start the timer immediately with fresh state
    setTimeout(() => {
      console.log('[TimerService] Auto-starting timer after reset');
      this.start();
    }, 500);
  }
}

export const timerService = new TimerService();
