<script lang="ts">
  import { onMount } from 'svelte';
  import Settings from './components/Settings.svelte';
  import Timer from './components/Timer.svelte';
  import { applyTheme, getResolvedTheme } from './lib/theme';
  import { timerService } from './services/timerService';
  import { idleDetectionService } from './services/idleDetectionService';
  import type { Theme } from './stores/app';
  import { appStore } from './stores/app';

  let resolvedTheme: 'light' | 'dark' | 'system' = 'system';
  let isReady = false;
  let showSettings = false; // Toggle between Timer and Settings view

  // Load saved theme from electron-store on mount
  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if ($appStore.theme === 'system') {
        resolvedTheme = getResolvedTheme();
      }
    };

    (async () => {
      const savedTheme = await window.api.store.get('theme');

      if (savedTheme) {
        applyTheme(savedTheme as Theme);
        appStore.setTheme(savedTheme as Theme);
      } else {
        applyTheme('system');
      }
    })().finally(() => {
      isReady = true;
      resolvedTheme = getResolvedTheme();
      mediaQuery.addEventListener('change', handleChange);
    });

    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('break:skipped', () => {
        timerService.skipBreak();
      });

      window.electron.ipcRenderer.on('break:snoozed', () => {
        timerService.snoozeBreak();
      });
    }

    // Initialize idle detection service
    console.log('[App] Initializing idle detection service');
    idleDetectionService.onResetTimer(() => {
      console.log('[App] Timer reset triggered by smart pause');
    });

    return () => mediaQuery.removeEventListener('change', handleChange);
  });

  // React to theme changes and save to electron-store
  $: if (isReady) {
    applyTheme($appStore.theme);

    window.api.store
      .set('theme', $appStore.theme)
      .then(() => {
        // Theme saved
      })
      .catch((err) => console.error('[APP] Error saving theme:', err));

    resolvedTheme = getResolvedTheme();
  }
</script>

<main>
  <header>
    <h1>BreakMate</h1>
    <div class="header-controls">
      <!-- Settings Button -->
      <button
        class="settings-btn"
        on:click={() => (showSettings = !showSettings)}
        title="Toggle settings"
      >
        {showSettings ? '⬅️ Back' : '⚙️'}
      </button>
    </div>
  </header>

  <div class="content">
    {#if showSettings}
      <Settings />
    {:else}
      <Timer />
    {/if}
  </div>
</main>

<style>
  :global(:root) {
    --bg-color: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    --bg-color-solid: #f5f7fa;
    --text-color: #2c3e50;
    --text-secondary: #7f8c8d;
    --accent-color: #3498db;
    --accent-dark: #2980b9;
    --button-bg: rgba(255, 255, 255, 0.8);
    --button-hover: rgba(255, 255, 255, 0.95);
    --button-border: rgba(52, 152, 219, 0.3);
    --card-bg: rgba(255, 255, 255, 0.9);
    --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    --border-color: rgba(52, 152, 219, 0.2);
  }

  :global(:root[data-theme='dark']),
  :global(:root:not([data-theme])) {
    @media (prefers-color-scheme: dark) {
      --bg-color: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
      --bg-color-solid: #0f2027;
      --text-color: #ecf0f1;
      --text-secondary: #bdc3c7;
      --accent-color: #3498db;
      --accent-dark: #2980b9;
      --button-bg: rgba(44, 62, 80, 0.8);
      --button-hover: rgba(52, 73, 94, 0.9);
      --button-border: rgba(52, 152, 219, 0.4);
      --card-bg: rgba(44, 62, 80, 0.85);
      --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      --border-color: rgba(52, 152, 219, 0.3);
    }
  }

  :global(:root[data-theme='dark']) {
    --bg-color: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
    --bg-color-solid: #0f2027;
    --text-color: #ecf0f1;
    --text-secondary: #bdc3c7;
    --accent-color: #3498db;
    --accent-dark: #2980b9;
    --button-bg: rgba(44, 62, 80, 0.8);
    --button-hover: rgba(52, 73, 94, 0.9);
    --button-border: rgba(52, 152, 219, 0.4);
    --card-bg: rgba(44, 62, 80, 0.85);
    --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    --border-color: rgba(52, 152, 219, 0.3);
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
      'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background: var(--bg-color-solid);
    color: var(--text-color);
    transition:
      background 0.3s ease,
      color 0.3s ease;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
    background-attachment: fixed;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
  }

  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }

  .header-controls {
    display: flex;
    gap: 0.75rem;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
