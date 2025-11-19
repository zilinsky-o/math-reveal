// Audio System for Math Picture Reveal Game
// Uses Web Audio API for sound generation

let audioContext = null;
let backgroundMusicInterval = null;
let backgroundMusicOscillators = [];

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(frequency, duration, type = 'sine', delay = 0) {
    initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const startTime = audioContext.currentTime + delay;
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function playSuccessSound() {
    playSound(523.25, 0.1, 'sine', 0);
    playSound(659.25, 0.1, 'sine', 0.1);
    playSound(783.99, 0.2, 'sine', 0.2);
}

function playCellRevealSound() {
    playSound(523.25, 0.15, 'sine', 0);
    playSound(659.25, 0.15, 'sine', 0.08);
    playSound(783.99, 0.15, 'sine', 0.16);
    playSound(1046.50, 0.3, 'sine', 0.24);
}

function playFailSound() {
    playSound(392, 0.15, 'sine', 0);
    playSound(349.23, 0.3, 'sine', 0.15);
}

function playCompletionSound() {
    playSound(523.25, 0.2, 'sine', 0);
    playSound(659.25, 0.2, 'sine', 0.15);
    playSound(783.99, 0.2, 'sine', 0.3);
    playSound(1046.50, 0.25, 'sine', 0.45);
    playSound(783.99, 0.2, 'sine', 0.7);
    playSound(1046.50, 0.25, 'sine', 0.85);
    playSound(1318.51, 0.3, 'sine', 1.0);
    playSound(1046.50, 0.2, 'sine', 1.3);
    playSound(1318.51, 0.4, 'sine', 1.45);
    playSound(1567.98, 0.6, 'sine', 1.7);
}

function playBossVictorySound() {
    initAudio();
    if (!audioContext) return;

    const notes = [
        { freq: 196, delay: 0, duration: 0.3 },
        { freq: 261.63, delay: 0.35, duration: 0.3 },
        { freq: 329.63, delay: 0.7, duration: 0.3 },
        { freq: 392, delay: 1.05, duration: 0.5 },
        { freq: 329.63, delay: 1.6, duration: 0.3 },
        { freq: 392, delay: 1.95, duration: 0.6 }
    ];

    notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = note.freq;
        oscillator.type = 'sawtooth';

        const startTime = audioContext.currentTime + note.delay;
        gainNode.gain.setValueAtTime(0.4, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
    });
}

function startBackgroundMusic() {
    if (!audioContext) initAudio();
    if (!audioContext) return;

    stopBackgroundMusic();

    const playNote = (frequency, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

        return oscillator;
    };

    let currentNote = 0;
    const notes = [130.81, 98];
    const playNextNote = () => {
        if (!backgroundMusicInterval) return;
        playNote(notes[currentNote], 0.4);
        currentNote = (currentNote + 1) % 2;
    };

    playNextNote();
    backgroundMusicInterval = setInterval(playNextNote, 1000);
}

function updateBackgroundMusicSpeed() {
    if (!backgroundMusicInterval) return;

    const distanceFromPlayer = bossPosition - 10;
    const maxDistance = 80;
    const minInterval = 200;
    const maxInterval = 1000;

    const interval = minInterval + ((distanceFromPlayer / maxDistance) * (maxInterval - minInterval));

    clearInterval(backgroundMusicInterval);

    let currentNote = 0;
    const notes = [130.81, 98];
    const playNextNote = () => {
        if (!backgroundMusicInterval) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = notes[currentNote];
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);

        currentNote = (currentNote + 1) % 2;
    };

    playNextNote();
    backgroundMusicInterval = setInterval(playNextNote, Math.max(minInterval, interval));
}

function stopBackgroundMusic() {
    if (backgroundMusicInterval) {
        clearInterval(backgroundMusicInterval);
        backgroundMusicInterval = null;
    }
    backgroundMusicOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
    });
    backgroundMusicOscillators = [];
}
