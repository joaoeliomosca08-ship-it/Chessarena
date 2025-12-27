/**
 * SISTEMA DE SONS DO JOGO DE XADREZ
 * Gerencia todos os efeitos sonoros do jogo
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.enabled = true;
        this.volumeLevels = {
            master: 70,
            move: 80,
            capture: 90,
            check: 100,
            castle: 80,
            promotion: 80,
            illegal: 60,
            click: 50,
            background: 40
        };
        
        this.soundTypes = {
            MOVE: 'move',
            CAPTURE: 'capture',
            CHECK: 'check',
            CHECKMATE: 'checkmate',
            CASTLE: 'castle',
            PROMOTION: 'promotion',
            ILLEGAL: 'illegal',
            CLICK: 'click',
            BACKGROUND: 'background',
            VICTORY: 'victory',
            DEFEAT: 'defeat',
            DRAW: 'draw',
            NOTIFICATION: 'notification',
            HOVER: 'hover',
            PIECE_PICKUP: 'piece_pickup',
            PIECE_DROP: 'piece_drop',
            COUNTDOWN: 'countdown',
            TIMER_ALERT: 'timer_alert',
            MENU_OPEN: 'menu_open',
            MENU_CLOSE: 'menu_close',
            GAME_START: 'game_start',
            GAME_END: 'game_end'
        };
        
        this.soundPresets = {
            CLASSIC: 'classic',
            MODERN: 'modern',
            FANTASY: 'fantasy',
            MINIMAL: 'minimal',
            CARTOON: 'cartoon'
        };
        
        this.currentPreset = this.soundPresets.CLASSIC;
        this.backgroundMusic = null;
        this.isMusicPlaying = false;
        this.musicVolume = 0.3;
        
        this.init();
    }
    
    /**
     * Inicializa o sistema de sons
     */
    init() {
        this.createAudioContext();
        this.loadDefaultSounds();
        this.createFallbackSounds();
        this.loadSoundPresets();
        this.setupEventListeners();
        
        // Tenta carregar sons externos
        this.loadExternalSounds();
        
        console.log('SoundManager inicializado com sucesso');
    }
    
    /**
     * Cria o contexto de áudio
     */
    createAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext criado com sucesso');
        } catch (e) {
            console.warn('AudioContext não suportado, usando fallback:', e);
            this.audioContext = null;
        }
    }
    
    /**
     * Carrega sons padrão do jogo
     */
    loadDefaultSounds() {
        const soundElements = {
            [this.soundTypes.MOVE]: document.getElementById('sound-move'),
            [this.soundTypes.CAPTURE]: document.getElementById('sound-capture'),
            [this.soundTypes.CHECK]: document.getElementById('sound-check'),
            [this.soundTypes.CHECKMATE]: document.getElementById('sound-checkmate'),
            [this.soundTypes.CASTLE]: document.getElementById('sound-castle'),
            [this.soundTypes.PROMOTION]: document.getElementById('sound-promotion'),
            [this.soundTypes.ILLEGAL]: document.getElementById('sound-illegal'),
            [this.soundTypes.CLICK]: document.getElementById('sound-click')
        };
        
        Object.keys(soundElements).forEach(type => {
            if (soundElements[type]) {
                this.sounds[type] = {
                    element: soundElements[type],
                    buffer: null,
                    isLoading: false,
                    lastPlayed: 0
                };
                
                // Tenta decodificar o áudio se AudioContext estiver disponível
                if (this.audioContext && soundElements[type].src) {
                    this.decodeAudioData(type, soundElements[type].src);
                }
            }
        });
    }
    
    /**
     * Decodifica dados de áudio
     */
    decodeAudioData(soundType, url) {
        if (this.sounds[soundType].isLoading) return;
        
        this.sounds[soundType].isLoading = true;
        
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.sounds[soundType].buffer = audioBuffer;
                this.sounds[soundType].isLoading = false;
                console.log(`Som ${soundType} carregado com sucesso`);
            })
            .catch(error => {
                console.warn(`Erro ao carregar som ${soundType}:`, error);
                this.sounds[soundType].isLoading = false;
            });
    }
    
    /**
     * Cria sons de fallback usando Web Audio API
     */
    createFallbackSounds() {
        if (!this.audioContext) return;
        
        // Sons básicos gerados programaticamente
        this.createFallbackSound(this.soundTypes.MOVE, this.generateMoveSound.bind(this));
        this.createFallbackSound(this.soundTypes.CAPTURE, this.generateCaptureSound.bind(this));
        this.createFallbackSound(this.soundTypes.CHECK, this.generateCheckSound.bind(this));
        this.createFallbackSound(this.soundTypes.CLICK, this.generateClickSound.bind(this));
        this.createFallbackSound(this.soundTypes.ILLEGAL, this.generateIllegalSound.bind(this));
    }
    
    /**
     * Cria um som de fallback
     */
    createFallbackSound(soundType, generatorFunction) {
        if (!this.sounds[soundType] || !this.sounds[soundType].buffer) {
            try {
                const buffer = generatorFunction();
                if (buffer) {
                    if (!this.sounds[soundType]) {
                        this.sounds[soundType] = {};
                    }
                    this.sounds[soundType].buffer = buffer;
                    this.sounds[soundType].isFallback = true;
                }
            } catch (e) {
                console.warn(`Erro ao criar fallback para ${soundType}:`, e);
            }
        }
    }
    
    /**
     * Gera som de movimento (fallback)
     */
    generateMoveSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Som suave de deslize
            data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-15 * t);
        }
        
        return buffer;
    }
    
    /**
     * Gera som de captura (fallback)
     */
    generateCaptureSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Som mais "pesado" para captura
            const frequency = 400 * Math.exp(-5 * t);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-20 * t);
        }
        
        return buffer;
    }
    
    /**
     * Gera som de xeque (fallback)
     */
    generateCheckSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Som de alerta/aviso
            const frequency = 600 + 200 * Math.sin(2 * Math.PI * 5 * t);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-10 * t);
        }
        
        return buffer;
    }
    
    /**
     * Gera som de clique (fallback)
     */
    generateClickSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.05;
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Som curto e agudo
            data[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-100 * t);
        }
        
        return buffer;
    }
    
    /**
     * Gera som de movimento ilegal (fallback)
     */
    generateIllegalSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            // Som de erro/negação
            const frequency = 300 - 100 * Math.sin(2 * Math.PI * 3 * t);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-15 * t);
        }
        
        return buffer;
    }
    
    /**
     * Carrega sons externos adicionais
     */
    loadExternalSounds() {
        // URLs de sons adicionais
        const externalSounds = {
            [this.soundTypes.VICTORY]: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
            [this.soundTypes.DEFEAT]: 'https://assets.mixkit.co/sfx/preview/mixkit-losing-bleeps-2026.mp3',
            [this.soundTypes.DRAW]: 'https://assets.mixkit.co/sfx/preview/mixkit-game-show-wrong-answer-buzz-950.mp3',
            [this.soundTypes.NOTIFICATION]: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
            [this.soundTypes.HOVER]: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
            [this.soundTypes.GAME_START]: 'https://assets.mixkit.co/sfx/preview/mixkit-game-show-intro-331.mp3',
            [this.soundTypes.GAME_END]: 'https://assets.mixkit.co/sfx/preview/mixkit-game-over-tetris-2047.mp3'
        };
        
        // Carrega apenas se o usuário permitir e tiver conexão
        if (navigator.onLine && this.enabled) {
            Object.keys(externalSounds).forEach(type => {
                this.loadSoundFromURL(type, externalSounds[type]);
            });
        }
    }
    
    /**
     * Carrega som de uma URL
     */
    loadSoundFromURL(soundType, url) {
        if (this.sounds[soundType] && this.sounds[soundType].buffer) return;
        
        if (!this.sounds[soundType]) {
            this.sounds[soundType] = {
                buffer: null,
                isLoading: false,
                lastPlayed: 0
            };
        }
        
        if (this.audioContext) {
            this.decodeAudioData(soundType, url);
        } else {
            // Fallback para elemento de áudio HTML
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto';
            
            this.sounds[soundType].element = audio;
            this.sounds[soundType].isLoading = false;
        }
    }
    
    /**
     * Carrega presets de som
     */
    loadSoundPresets() {
        this.presetConfigs = {
            [this.soundPresets.CLASSIC]: {
                description: 'Sons clássicos de xadrez',
                volumes: { move: 80, capture: 90, check: 100 }
            },
            [this.soundPresets.MODERN]: {
                description: 'Sons modernos e suaves',
                volumes: { move: 70, capture: 80, check: 90 }
            },
            [this.soundPresets.FANTASY]: {
                description: 'Sons épicos e mágicos',
                volumes: { move: 85, capture: 95, check: 100 }
            },
            [this.soundPresets.MINIMAL]: {
                description: 'Sons mínimos e discretos',
                volumes: { move: 50, capture: 60, check: 70 }
            },
            [this.soundPresets.CARTOON]: {
                description: 'Sons divertidos e exagerados',
                volumes: { move: 90, capture: 100, check: 100 }
            }
        };
    }
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Listener para o toggle de som
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.setEnabled(e.target.checked);
            });
        }
        
        // Listeners para controles de volume
        const volumeControls = ['master-volume', 'move-volume', 'capture-volume', 'check-volume'];
        volumeControls.forEach(id => {
            const control = document.getElementById(id);
            if (control) {
                control.addEventListener('input', (e) => {
                    this.updateVolumeLevel(id.replace('-volume', ''), parseInt(e.target.value));
                });
            }
        });
        
        // Listener para presets de som
        document.addEventListener('soundPresetChange', (e) => {
            if (e.detail && e.detail.preset) {
                this.setSoundPreset(e.detail.preset);
            }
        });
        
        // Pausa sons quando a página não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            }
        });
    }
    
    /**
     * Toca um som específico
     */
    play(soundType, options = {}) {
        if (!this.enabled) return;
        
        const now = Date.now();
        const sound = this.sounds[soundType];
        
        // Evita spam de sons (cooldown de 50ms)
        if (sound && now - sound.lastPlayed < 50) {
            return;
        }
        
        const volume = options.volume || this.getVolumeForType(soundType);
        const rate = options.playbackRate || 1.0;
        const pan = options.pan || 0;
        
        if (sound) {
            sound.lastPlayed = now;
            
            // Tenta usar AudioContext primeiro
            if (this.audioContext && sound.buffer) {
                this.playWithAudioContext(soundType, volume, rate, pan);
            } 
            // Fallback para elemento de áudio HTML
            else if (sound.element) {
                this.playWithAudioElement(soundType, volume
