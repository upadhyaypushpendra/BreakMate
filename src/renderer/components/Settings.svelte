<!-- src/lib/components/Settings.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { timerSettings } from '../stores/timer';
  import { appStore } from '../stores/app';

  let autoLaunchEnabled = false;
  let isLoadingAutoLaunch = true;

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
