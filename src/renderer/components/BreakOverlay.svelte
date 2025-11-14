<!-- src/renderer/components/BreakOverlay.svelte -->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { timerService } from '../services/timerService';

  let timeRemaining = 20; // seconds
  let messages = [
    '👀 Look away from the screen',
    '💧 Hydrate yourself',
    '🧘 Stretch your body',
    '🌬️ Take a deep breath',
    '👁️ Rest your eyes',
    '🚶 Walk around a bit',
    '🌿 Breathe slowly and deeply',
    '😌 Relax your shoulders',
    '🏃 Move around',
    '☕ Grab a drink',
    '🪟 Look outside',
    '🤗 Close your eyes',
    '💆 Massage your neck',
    '⏸️ Just be still',
    '🌊 Find your calm',
  ];
  let currentMessage = messages[0];

  onMount(() => {
    if (window.electron?.ipcRenderer) {
      // Listen for initial break start
      window.electron.ipcRenderer.on('break:start', (_event, data) => {
        timeRemaining = data.duration;
        currentMessage = messages[Math.floor(Math.random() * messages.length)];
        console.log(`[BreakOverlay] Break started with ${timeRemaining}s`);
      });

      window.electron.ipcRenderer.on('break:timer-update', (_event, data) => {
        timeRemaining = data.remaining;

        if (timeRemaining <= 0) {
          console.log('[BreakOverlay] Break ended');
          // Note: Work timer will be started automatically by main process
        }
      });
    }
  });

  onDestroy(() => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.removeAllListeners('break:start');
      window.electron.ipcRenderer.removeAllListeners('break:timer-update');
    }
  });

  function handleSkip() {
    timerService.skipBreak();
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('break:skip', true);
    }
  }

  function handleSnooze() {
    timerService.snoozeBreak();
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('break:snooze', true);
    }
  }

  $: formattedTime = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;
</script>

<div class="break-overlay">
  <div class="background-animation">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>
  
  <div class="bubbles-container">
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>
    <div class="bubble bubble-4"></div>
    <div class="bubble bubble-5"></div>
    <div class="bubble bubble-6"></div>
    <div class="bubble bubble-7"></div>
    <div class="bubble bubble-8"></div>
  </div>
  
  <div class="content">
    <h1 class="message">{currentMessage}</h1>
    <p class="timer">{formattedTime}</p>

    <div class="actions">
      <button class="skip-btn" on:click={handleSkip}> Skip Break </button>
      <button class="snooze-btn" on:click={handleSnooze}> Snooze 5 min </button>
    </div>
  </div>
</div>

<style>
  .break-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.75) 0%, rgba(22, 33, 62, 0.75) 50%, rgba(15, 52, 96, 0.75) 100%);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    overflow: hidden;
    animation: fade-in 1s ease-out forwards;
  }

  @keyframes fade-in {
    0% {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    100% {
      opacity: 1;
      backdrop-filter: blur(10px);
    }
  }

  .background-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    opacity: 0.3;
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
  }

  .blob-1 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle at 30% 70%, #4a90e2 0%, transparent 70%);
    animation: float-animation 15s infinite ease-in-out;
    top: -100px;
    left: -100px;
  }

  .blob-2 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle at 60% 40%, #7b68ee 0%, transparent 70%);
    animation: float-animation 18s infinite ease-in-out reverse;
    bottom: -50px;
    right: -50px;
    animation-delay: -5s;
  }

  .blob-3 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle at 50% 50%, #48d1cc 0%, transparent 70%);
    animation: float-animation 20s infinite ease-in-out;
    top: 50%;
    left: 50%;
    animation-delay: -10s;
  }

  @keyframes float-animation {
    0%,
    100% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(30px, -30px);
    }
    50% {
      transform: translate(-20px, 20px);
    }
    75% {
      transform: translate(20px, 30px);
    }
  }

  .bubbles-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    opacity: 0.4;
  }

  .bubble {
    position: absolute;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.05));
    filter: blur(0.5px);
  }

  .bubble-1 {
    width: 180px;
    height: 180px;
    left: 10%;
    bottom: -180px;
    animation: bubble-rise 8s infinite ease-in;
  }

  .bubble-2 {
    width: 60px;
    height: 60px;
    left: 20%;
    bottom: -60px;
    animation: bubble-rise 10s infinite ease-in;
    animation-delay: 1s;
  }

  .bubble-3 {
    width: 40px;
    height: 40px;
    left: 35%;
    bottom: -40px;
    animation: bubble-rise 9s infinite ease-in;
    animation-delay: 2s;
  }

  .bubble-4 {
    width: 150px;
    height: 150px;
    left: 50%;
    bottom: -150px;
    animation: bubble-rise 11s infinite ease-in;
    animation-delay: 0.5s;
  }

  .bubble-5 {
    width: 70px;
    height: 70px;
    left: 65%;
    bottom: -70px;
    animation: bubble-rise 9.5s infinite ease-in;
    animation-delay: 1.5s;
  }

  .bubble-6 {
    width: 45px;
    height: 45px;
    left: 75%;
    bottom: -45px;
    animation: bubble-rise 10.5s infinite ease-in;
    animation-delay: 2.5s;
  }

  .bubble-7 {
    width: 55px;
    height: 55px;
    left: 85%;
    bottom: -55px;
    animation: bubble-rise 8.5s infinite ease-in;
    animation-delay: 1s;
  }

  .bubble-8 {
    width: 35px;
    height: 35px;
    left: 30%;
    bottom: -35px;
    animation: bubble-rise 12s infinite ease-in;
    animation-delay: 3s;
  }

  @keyframes bubble-rise {
    0% {
      bottom: -200px;
      opacity: 0;
      transform: translateX(0);
    }
    10% {
      opacity: 1;
    }
    50% {
      transform: translateX(50px);
    }
    90% {
      opacity: 1;
    }
    100% {
      bottom: 120vh;
      opacity: 0;
      transform: translateX(-30px);
    }
  }

  .content {
    position: relative;
    z-index: 10;
    text-align: center;
    color: white;
    max-width: 800px;
    padding: 2rem;
  }

  .message {
    font-size: 4rem;
    font-weight: 800;
    margin: 0 0 2rem 0;
    line-height: 1.2;
    text-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
    animation: pulse 3s ease-in-out infinite;
    letter-spacing: 0.5px;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.02);
      opacity: 1;
    }
  }

  .timer {
    font-size: 6rem;
    font-weight: 900;
    font-family: 'Monaco', 'Courier New', monospace;
    margin: 2rem 0;
    text-shadow: 0 6px 40px rgba(0, 0, 0, 0.7);
    letter-spacing: 2px;
  }

  .actions {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    margin-top: 3rem;
  }

  .actions button {
    padding: 1rem 2.5rem;
    font-size: 1.2rem;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
  }

  .skip-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .skip-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  }

  .snooze-btn {
    background: rgba(74, 144, 226, 0.2);
    color: white;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(74, 144, 226, 0.4);
  }

  .snooze-btn:hover {
    background: rgba(74, 144, 226, 0.3);
    border-color: rgba(74, 144, 226, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(74, 144, 226, 0.4);
  }

  /* Responsive for smaller screens */
  @media (max-width: 768px) {
    .message {
      font-size: 2.5rem;
    }

    .timer {
      font-size: 4rem;
    }

    .actions button {
      font-size: 1rem;
      padding: 0.75rem 2rem;
    }
  }
</style>
