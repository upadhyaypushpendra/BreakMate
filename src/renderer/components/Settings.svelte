<!-- src/lib/components/Settings.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { timerSettings } from '../stores/timer';
  import { appStore } from '../stores/app';
  import { idleDetectionService } from '../services/idleDetectionService';

  let autoLaunchEnabled = false;
  let isLoadingAutoLaunch = true;
  let smartPauseEnabled = true;
  let smartPauseThreshold = 5;
  let isLoadingSmartPause = true;

  onMount(async () => {
    // Load current auto-launch status
    if (window.api?.autoLaunch) {
      try {
        const isEnabled = await window.api.autoLaunch.isEnabled();
        console.log('[Settings] Loaded auto-launch status:', isEnabled);
        autoLaunchEnabled = isEnabled;
      } catch (error) {
        console.error('[Settings] Failed to load auto-launch status:', error);
      } finally {
        isLoadingAutoLaunch = false;
      }
    } else {
      console.warn('[Settings] autoLaunch API not available');
      isLoadingAutoLaunch = false;
    }

    // Load smart pause settings
    try {
      smartPauseEnabled = await idleDetectionService.isSmartPauseEnabled();
      smartPauseThreshold = await idleDetectionService.getSmartPauseThreshold();
      console.log('[Settings] Loaded smart pause settings:', { smartPauseEnabled, smartPauseThreshold });
    } catch (error) {
      console.error('[Settings] Failed to load smart pause settings:', error);
    } finally {
      isLoadingSmartPause = false;
    }
  });

  async function toggleAutoLaunch(event: Event) {
    if (!window.api?.autoLaunch) return;

    const checkbox = event.target as HTMLInputElement;
    const newValue = checkbox.checked;

    try {
      if (newValue) {
        // Trying to enable
        const result = await window.api.autoLaunch.enable();
        if (!result.success) {
          console.error('[Settings] Failed to enable auto-launch:', result.error);
          autoLaunchEnabled = false; // Revert on failure
        } else {
          console.log('[Settings] Auto-launch enabled successfully');
          autoLaunchEnabled = true;
        }
      } else {
        // Trying to disable
        const result = await window.api.autoLaunch.disable();
        if (!result.success) {
          console.error('[Settings] Failed to disable auto-launch:', result.error);
          autoLaunchEnabled = true; // Revert on failure
        } else {
          console.log('[Settings] Auto-launch disabled successfully');
          autoLaunchEnabled = false;
        }
      }
    } catch (error) {
      console.error('[Settings] Error toggling auto-launch:', error);
      autoLaunchEnabled = !newValue; // Revert on error
    }
  }

  async function toggleSmartPause(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const newValue = checkbox.checked;

    try {
      const success = await idleDetectionService.setSmartPauseEnabled(newValue);
      if (!success) {
        console.error('[Settings] Failed to update smart pause');
        smartPauseEnabled = !newValue;
      } else {
        console.log('[Settings] Smart pause updated:', newValue);
        smartPauseEnabled = newValue;
      }
    } catch (error) {
      console.error('[Settings] Error toggling smart pause:', error);
      smartPauseEnabled = !newValue;
    }
  }

  async function updateSmartPauseThreshold(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);

    try {
      const success = await idleDetectionService.setSmartPauseThreshold(newValue);
      if (!success) {
        console.error('[Settings] Failed to update smart pause threshold');
        smartPauseThreshold = 5;
      } else {
        console.log('[Settings] Smart pause threshold updated:', newValue);
        smartPauseThreshold = newValue;
      }
    } catch (error) {
      console.error('[Settings] Error updating smart pause threshold:', error);
      smartPauseThreshold = 5;
    }
  }

  function cycleTheme() {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf($appStore.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    appStore.setTheme(nextTheme);
  }
</script>

<div class="settings">
  <h2>Timer Settings</h2>

  <label>
    Work Duration (minutes):
    <input type="number" min="1" max="60" bind:value={$timerSettings.workDuration} />
  </label>

  <label>
    Break Duration (seconds):
    <input type="number" min="1" max="300" bind:value={$timerSettings.breakDuration} />
  </label>

  <label>
    Long Break Duration (minutes):
    <input type="number" min="1" max="30" bind:value={$timerSettings.longBreakDuration} />
  </label>

  <label>
    Long Break Every N cycles:
    <input type="number" min="1" max="10" bind:value={$timerSettings.longBreakInterval} />
  </label>

  <h2>App Settings</h2>

  <label class="checkbox-label">
    <input
      type="checkbox"
      bind:checked={autoLaunchEnabled}
      on:change={toggleAutoLaunch}
      disabled={isLoadingAutoLaunch}
    />
    Start BreakMate automatically when you log in
  </label>

  <h2>Smart Pause</h2>
  <p class="setting-description">
    Automatically reset your work timer when you return after a system lock. Prevents immediate break notifications after being away.
  </p>

  <label class="checkbox-label">
    <input
      type="checkbox"
      bind:checked={smartPauseEnabled}
      on:change={toggleSmartPause}
      disabled={isLoadingSmartPause}
    />
    Enable Smart Pause
  </label>

  {#if smartPauseEnabled}
    <label>
      Lock Duration Threshold (minutes):
      <input
        type="number"
        min="1"
        max="60"
        bind:value={smartPauseThreshold}
        on:change={updateSmartPauseThreshold}
        disabled={isLoadingSmartPause}
      />
      <small>If locked longer than this, timer resets when unlocked</small>
    </label>
  {/if}

  <h2>Appearance</h2>

  <button class="theme-btn" on:click={cycleTheme} title="Toggle theme">
    {#if $appStore.theme === 'light'}
      ☀️ Light Theme
    {:else if $appStore.theme === 'dark'}
      🌙 Dark Theme
    {:else}
      🖥️ System Theme
    {/if}
  </button>
</div>

<style>
  .settings {
    padding: 2rem;
    max-width: 500px;
  }

  h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
  }

  h2:first-child {
    margin-top: 0;
  }

  label {
    display: block;
    margin-bottom: 1rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  input[type='number'] {
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    border: 1.5px solid var(--border-color);
    border-radius: 6px;
    background: var(--card-bg);
    color: var(--text-color);
    font-size: 14px;
    transition: border-color 0.2s ease;
  }

  input[type='number']:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.75rem;
    border-radius: 6px;
    transition: background 0.2s ease;
  }

  .checkbox-label:hover {
    background: var(--button-hover);
  }

  input[type='checkbox'] {
    width: auto;
    margin: 0;
    cursor: pointer;
    accent-color: var(--accent-color);
  }

  input[type='checkbox']:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .setting-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1rem 0;
    line-height: 1.4;
  }

  small {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: normal;
  }

  .theme-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--button-bg);
    border: 1.5px solid var(--button-border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    transition: all 0.2s ease;
  }

  .theme-btn:hover {
    background: var(--button-hover);
    border-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  }

  .theme-btn:active {
    transform: translateY(0);
  }
</style>
