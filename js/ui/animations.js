/**
 * ui/animations.js
 *
 * Animation and sound effects
 * - Audio context initialization
 * - Sound effect functions
 * - Visual effects (crack SVG generation)
 * - Background music for boss battle
 *
 * Dependencies: core/game-state.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Initializes the audio context
     */
    Game.initAudio = function() {
        let audioContext = Game.getAudioContext();
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            Game.setAudioContext(audioContext);
        }
    };

    /**
     * Plays a sound with specified parameters
     */
    Game.playSound = function(frequency, duration, type, delay) {
        type = type || 'sine';
        delay = delay || 0;

        Game.initAudio();
        const audioContext = Game.getAudioContext();
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
    };

    /**
     * Plays success sound effect
     */
    Game.playSuccessSound = function() {
        Game.playSound(523.25, 0.1, 'sine', 0);
        Game.playSound(659.25, 0.1, 'sine', 0.1);
        Game.playSound(783.99, 0.2, 'sine', 0.2);
    };

    /**
     * Plays cell reveal sound effect
     */
    Game.playCellRevealSound = function() {
        Game.playSound(523.25, 0.15, 'sine', 0);
        Game.playSound(659.25, 0.15, 'sine', 0.08);
        Game.playSound(783.99, 0.15, 'sine', 0.16);
        Game.playSound(1046.50, 0.3, 'sine', 0.24);
    };

    /**
     * Plays fail sound effect
     */
    Game.playFailSound = function() {
        Game.playSound(392, 0.15, 'sine', 0);
        Game.playSound(349.23, 0.3, 'sine', 0.15);
    };

    /**
     * Plays level completion sound effect
     */
    Game.playCompletionSound = function() {
        Game.playSound(523.25, 0.2, 'sine', 0);
        Game.playSound(659.25, 0.2, 'sine', 0.15);
        Game.playSound(783.99, 0.2, 'sine', 0.3);
        Game.playSound(1046.50, 0.25, 'sine', 0.45);
        Game.playSound(783.99, 0.2, 'sine', 0.7);
        Game.playSound(1046.50, 0.25, 'sine', 0.85);
        Game.playSound(1318.51, 0.3, 'sine', 1.0);
        Game.playSound(1046.50, 0.2, 'sine', 1.3);
        Game.playSound(1318.51, 0.4, 'sine', 1.45);
        Game.playSound(1567.98, 0.6, 'sine', 1.7);
    };

    /**
     * Plays boss victory sound effect
     */
    Game.playBossVictorySound = function() {
        Game.initAudio();
        const audioContext = Game.getAudioContext();
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
    };

    /**
     * Starts background music for boss battle
     */
    Game.startBackgroundMusic = function() {
        const audioContext = Game.getAudioContext();
        if (!audioContext) Game.initAudio();
        if (!Game.getAudioContext()) return;

        Game.stopBackgroundMusic();

        const playNote = (frequency, duration) => {
            const ctx = Game.getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'triangle';

            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);

            return oscillator;
        };

        let currentNote = 0;
        const notes = [130.81, 98];
        const playNextNote = () => {
            if (!Game.getBackgroundMusicInterval()) return;
            playNote(notes[currentNote], 0.4);
            currentNote = (currentNote + 1) % 2;
        };

        playNextNote();
        const interval = setInterval(playNextNote, 1000);
        Game.setBackgroundMusicInterval(interval);
    };

    /**
     * Updates background music speed based on boss position
     */
    Game.updateBackgroundMusicSpeed = function() {
        if (!Game.getBackgroundMusicInterval()) return;

        const bossPosition = Game.getBossPosition();
        const distanceFromPlayer = bossPosition - 10;
        const maxDistance = 80;
        const minInterval = 200;
        const maxInterval = 1000;

        const interval = minInterval + ((distanceFromPlayer / maxDistance) * (maxInterval - minInterval));

        clearInterval(Game.getBackgroundMusicInterval());

        let currentNote = 0;
        const notes = [130.81, 98];
        const playNextNote = () => {
            if (!Game.getBackgroundMusicInterval()) return;
            const audioContext = Game.getAudioContext();
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
        const newInterval = setInterval(playNextNote, Math.max(minInterval, interval));
        Game.setBackgroundMusicInterval(newInterval);
    };

    /**
     * Stops background music
     */
    Game.stopBackgroundMusic = function() {
        const musicInterval = Game.getBackgroundMusicInterval();
        if (musicInterval) {
            clearInterval(musicInterval);
            Game.setBackgroundMusicInterval(null);
        }
        const oscillators = Game.getBackgroundMusicOscillators();
        oscillators.forEach(osc => {
            try { osc.stop(); } catch (e) {}
        });
        Game.setBackgroundMusicOscillators([]);
    };

    /**
     * Creates SVG for cell crack effect
     */
    Game.createCrackSVG = function() {
        const currentLevel = Game.getCurrentLevel();
        let color = '#8b5cf6';
        if (currentLevel === 2) color = '#f59e0b';
        if (currentLevel === 3) color = '#10b981';
        if (currentLevel === 4) color = '#6366f1';
        if (currentLevel === 5) color = '#dc2626';

        return `<svg width="62.5" height="62.5" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10 0 L 15 20 L 25 15 L 30 35 L 40 30"
                  stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
            <path d="M 30 0 L 35 25 L 45 20 L 50 40"
                  stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
            <path d="M 0 20 L 20 25 L 15 40 L 30 45"
                  stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
            <path d="M 20 50 L 30 55 L 40 50 L 50 62.5"
                  stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
        </svg>`;
    };

})();
