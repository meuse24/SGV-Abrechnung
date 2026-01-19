// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { loadTimeData } from '../../polyfills/js/load_time_data.js';
import '../../polyfills/window_polyfills.js';
import { HIDDEN_CLASS } from '../../polyfills/constants.js';
import { IS_HIDPI, IS_IOS, IS_MOBILE } from '../config/constants.js';
import { DistanceMeter } from '../ui/distance_meter.js';
import { GameOverPanel } from '../ui/game_over_panel.js';
import { Horizon } from '../entities/horizon.js';
import { spriteDefinitionByType } from '../config/offline_sprite_definitions.js';
import { Status as TrexStatus, Trex } from '../entities/trex.js';
import { getTimeStamp } from '../utils/utils.js';
import { InputManager, InputEventType } from '../input/input_manager.js';
import { CollisionDetector } from './collision_detector.js';
import { AssetManager } from './asset_manager.js';
import { ScoreManager } from './score_manager.js';
import { AudioManager } from './audio_manager.js';
import { LayoutManager } from './layout_manager.js';
import { GameLoopController } from './game_loop_controller.js';
import { VisualEffectsManager } from './visual_effects_manager.js';
import { AltGameModeManager } from './alt_game_mode_manager.js';
import { AccessibilityManager } from './accessibility_manager.js';
var A11yStrings;
(function (A11yStrings) {
    A11yStrings["ARIA_LABEL"] = "dinoGameA11yAriaLabel";
    A11yStrings["DESCRIPTION"] = "dinoGameA11yDescription";
    A11yStrings["GAME_OVER"] = "dinoGameA11yGameOver";
    A11yStrings["HIGH_SCORE"] = "dinoGameA11yHighScore";
    A11yStrings["JUMP"] = "dinoGameA11yJump";
    A11yStrings["STARTED"] = "dinoGameA11yStartGame";
    A11yStrings["SPEED_LABEL"] = "dinoGameA11ySpeedToggle";
})(A11yStrings || (A11yStrings = {}));
const defaultBaseConfig = {
    audiocueProximityThreshold: 190,
    audiocueProximityThresholdMobileA11y: 250,
    bgCloudSpeed: 0.2,
    bottomPad: 10,
    // Scroll Y threshold at which the game can be activated.
    canvasInViewOffset: -10,
    clearTime: 3000,
    cloudFrequency: 0.5,
    fadeDuration: 1,
    flashDuration: 1000,
    gameoverClearTime: 1200,
    initialJumpVelocity: 12,
    invertFadeDuration: 12000,
    maxBlinkCount: 3,
    maxClouds: 6,
    maxObstacleLength: 3,
    maxObstacleDuplication: 2,
    resourceTemplateId: 'audio-resources',
    speed: 6,
    speedDropCoefficient: 3,
    arcadeModeInitialTopPosition: 35,
    arcadeModeTopPositionPercent: 0.1,
};
const normalModeConfig = {
    acceleration: 0.001,
    audiocueProximityThreshold: 190,
    audiocueProximityThresholdMobileA11y: 250,
    gapCoefficient: 0.6,
    invertDistance: 700,
    maxSpeed: 13,
    mobileSpeedCoefficient: 1.2,
    speed: 6,
};
const slowModeConfig = {
    acceleration: 0.0005,
    audiocueProximityThreshold: 170,
    audiocueProximityThresholdMobileA11y: 220,
    gapCoefficient: 0.3,
    invertDistance: 350,
    maxSpeed: 9,
    mobileSpeedCoefficient: 1.5,
    speed: 4.2,
};
/**
 * CSS class names.
 */
var RunnerClasses;
(function (RunnerClasses) {
    RunnerClasses["ARCADE_MODE"] = "arcade-mode";
    RunnerClasses["CANVAS"] = "runner-canvas";
    RunnerClasses["CONTAINER"] = "runner-container";
    RunnerClasses["CRASHED"] = "crashed";
    RunnerClasses["ICON"] = "icon-offline";
    RunnerClasses["ICON_DISABLED"] = "icon-disabled";
    RunnerClasses["INVERTED"] = "inverted";
    RunnerClasses["SNACKBAR"] = "snackbar";
    RunnerClasses["SNACKBAR_SHOW"] = "snackbar-show";
    RunnerClasses["TOUCH_CONTROLLER"] = "controller";
})(RunnerClasses || (RunnerClasses = {}));
var RunnerEvents;
(function (RunnerEvents) {
    RunnerEvents["ANIM_END"] = "webkitAnimationEnd";
    RunnerEvents["RESIZE"] = "resize";
    RunnerEvents["VISIBILITY"] = "visibilitychange";
    RunnerEvents["BLUR"] = "blur";
    RunnerEvents["FOCUS"] = "focus";
    RunnerEvents["LOAD"] = "load";
    RunnerEvents["POINTERUP"] = "pointerup";
})(RunnerEvents || (RunnerEvents = {}));
const SKY_COLOR = '#c5ebff';
const GRASS_COLOR = '#ecf8e6';
const SUN_COLOR = '#fff3b0';
const SUN_GLOW_COLOR = '#fff7d6';
const SUN_ALPHA = 0.55;
const SUN_GLOW_ALPHA = 0.25;
const SUN_SPEED = 0.006;
const HILLS_COLOR = '#b7d9ea';
const HILLS_ALPHA = 0.35;
const HILLS_SPEED = 0.0045;
const GROUND_SPLIT_RATIO = 0.84;
let runnerInstance = null;
/**
 * T-Rex runner.
 */
export class Runner {
    // Initialize the singleton instance of Runner. Should only be called once.
    static initializeInstance(outerContainerId, config) {
        assert(runnerInstance === null);
        runnerInstance = new Runner(outerContainerId, config);
        if (!runnerInstance.isDisabled) {
            runnerInstance.assetManager.loadImages(runnerInstance.init.bind(runnerInstance));
        }
        return runnerInstance;
    }
    static getInstance() {
        assert(runnerInstance);
        return runnerInstance;
    }
    constructor(outerContainerId, configParam) {
        this.containerEl = null;
        // A div to intercept touch events. Only set while (playing && useTouch).
        this.touchController = null;
        this.canvas = null;
        this.canvasCtx = null;
        // UI components.
        this.tRex = null;
        this.distanceMeter = null;
        this.gameOverPanel = null;
        this.horizon = null;
        this.distanceRan = 0;
        this.playCount = 0;
        // Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
        this.isDisabled = loadTimeData.valueExists('disabledEasterEgg');
        // Whether the easter egg has been activated.
        this.activated = false;
        // Whether the game is currently in play state.
        this.playing = false;
        this.playingIntro = false;
        this.crashed = false;
        this.paused = false;
        this.inputManager = null;
        this.sunX = null;
        this.sunLastTs = 0;
        this.hillsOffset = 0;
        const outerContainerElement = document.querySelector(outerContainerId);
        assert(outerContainerElement);
        this.outerContainerEl = outerContainerElement;
        this.config =
            configParam || Object.assign({}, defaultBaseConfig, normalModeConfig);
        this.collisionDetector = new CollisionDetector();
        this.altGameModeManager = new AltGameModeManager(this.config);
        if (this.isAltGameModeEnabled()) {
            this.altGameModeManager.initAltGameType();
        }
        this.assetManager = new AssetManager(this.altGameModeManager.getGameType());
        this.scoreManager = new ScoreManager();
        this.audioManager = new AudioManager(this.config);
        this.layoutManager = new LayoutManager(this.outerContainerEl, this.containerEl, this.config);
        this.accessibilityManager = new AccessibilityManager(this.config, Object.assign({}, defaultBaseConfig, normalModeConfig), normalModeConfig, slowModeConfig);
        this.accessibilityManager.setIsAltGameModeEnabledCallback(() => this.isAltGameModeEnabled());
        this.gameLoopController = new GameLoopController(this.config, this.accessibilityManager.hasSlowdown, () => this.layoutManager.getDimensions());
        this.visualEffectsManager = new VisualEffectsManager(this.config, RunnerClasses, false);
        if (this.isDisabled) {
            this.setupDisabledRunner();
            return;
        }
        window.initializeEasterEggHighScore = (highScore) => {
            assert(this.distanceMeter);
            this.scoreManager.initializeHighScore(highScore, this.distanceMeter);
        };
    }
    // GameStateProvider implementation.
    get hasSlowdown() {
        return this.accessibilityManager.hasSlowdown;
    }
    // GameStateProvider implementation.
    get hasAudioCues() {
        return this.accessibilityManager.hasAudioCues;
    }
    /**
     * Build accessibility callbacks for the accessibility manager.
     */
    getAccessibilityCallbacks() {
        return {
            isActivated: () => this.activated,
            isCrashed: () => this.crashed,
            isPlaying: () => this.playing,
            isAltGameModeEnabled: () => this.isAltGameModeEnabled(),
            enableGeneratedSoundFx: () => this.audioManager.enableGeneratedSoundFx(),
            updateConfig: (config) => {
                this.config = config;
                this.accessibilityManager.updateConfig(config);
            },
            setSpeed: (speed) => this.gameLoopController.setSpeed(speed),
            enableSlowConfigOnTRex: () => {
                assert(this.tRex);
                this.tRex.enableSlowConfig();
            },
            adjustObstacleSpeed: () => {
                assert(this.horizon);
                this.horizon.adjustObstacleSpeed();
            },
        };
    }
    /**
     * Build alt game mode callbacks for the alt game mode manager.
     */
    getAltGameModeCallbacks() {
        return {
            switchToAltGameSprite: () => this.assetManager.switchToAltGameSprite(),
            enableAltGameModeOnTRex: (spriteDef) => {
                assert(this.tRex);
                this.tRex.enableAltGameMode(spriteDef);
            },
            enableAltGameModeOnHorizon: (spriteDef) => {
                assert(this.horizon);
                this.horizon.enableAltGameMode(spriteDef);
            },
            playBackgroundSound: () => this.getGeneratedSoundFx()?.background(),
            setTRexFlashing: (flashing) => {
                assert(this.tRex);
                this.tRex.setFlashing(flashing);
            },
            updateTRex: (dt) => {
                assert(this.tRex);
                this.tRex.update(dt);
            },
            resetRunningTime: () => this.gameLoopController.setRunningTime(0),
        };
    }
    /**
     * Whether an alternative game mode is enabled, returns true if the load time
     * data specifies it and its assets loaded successfully. Returns false
     * otherwise.
     * GameStateProvider implementation.
     */
    isAltGameModeEnabled() {
        // During initialization, assetManager might not be ready yet
        if (this.assetManager && this.assetManager.hasAltGameAssetsFailedToLoad()) {
            return false;
        }
        return loadTimeData.valueExists('enableAltGameMode');
    }
    // GeneratedSoundFxProvider implementation - delegate to AudioManager.
    getGeneratedSoundFx() {
        return this.audioManager.getGeneratedSoundFx();
    }
    // ImageSpriteProvider implementation - delegate to AssetManager.
    getSpriteDefinition() {
        return this.assetManager.getSpriteDefinition();
    }
    // ImageSpriteProvider implementation - delegate to AssetManager.
    getOrigImageSprite() {
        return this.assetManager.getOrigImageSprite();
    }
    // ImageSpriteProvider implementation - delegate to AssetManager.
    getRunnerImageSprite() {
        return this.assetManager.getRunnerImageSprite();
    }
    // ImageSpriteProvider implementation - delegate to AssetManager.
    getRunnerAltGameImageSprite() {
        return this.assetManager.getRunnerAltGameImageSprite();
    }
    // ImageSpriteProvider implementation - delegate to AssetManager.
    getAltCommonImageSprite() {
        return this.assetManager.getAltCommonImageSprite();
    }
    // ConfigProvider implementation.
    getConfig() {
        return this.config;
    }
    /**
     * For disabled instances, set up a snackbar with the disabled message.
     */
    setupDisabledRunner() {
        this.containerEl = document.createElement('div');
        this.containerEl.className = RunnerClasses.SNACKBAR;
        this.containerEl.textContent = loadTimeData.getValue('disabledEasterEgg');
        this.outerContainerEl.appendChild(this.containerEl);
        // Show notification when the activation key is pressed.
        document.addEventListener('keydown', (e) => {
            if ([32, 38].includes(e.keyCode)) {
                assert(this.containerEl);
                this.containerEl.classList.add(RunnerClasses.SNACKBAR_SHOW);
                const iconElement = document.querySelector('.icon');
                assert(iconElement);
                iconElement.classList.add(RunnerClasses.ICON_DISABLED);
            }
        });
    }
    /**
     * Sets individual settings for debugging.
     */
    updateConfigSetting(setting, value) {
        this.config[setting] = value;
    }
    /**
     * Sets individual settings for debugging.
     */
    updateTrexConfigSetting(setting, value) {
        assert(this.tRex);
        switch (setting) {
            case 'gravity':
            case 'minJumpHeight':
            case 'speedDropCoefficient':
                this.tRex.config[setting] = value;
                break;
            case 'initialJumpVelocity':
                this.tRex.setJumpVelocity(value);
                break;
            case 'speed':
                this.setSpeed(value);
                break;
            default:
                break;
        }
    }
    /**
     * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
     */
    setSpeed(newSpeed) {
        this.gameLoopController.setSpeed(newSpeed);
    }
    /**
     * Game initialiser.
     */
    init() {
        const spriteDef = this.assetManager.getSpriteDef();
        assert(spriteDef);
        const iconElement = document.querySelector('.' + RunnerClasses.ICON);
        assert(iconElement);
        // Hide the static icon.
        iconElement.style.visibility = 'hidden';
        if (this.layoutManager.isArcadeMode()) {
            document.title =
                document.title + ' - ' + getA11yString(A11yStrings.ARIA_LABEL);
        }
        this.adjustDimensions();
        this.setSpeed();
        const ariaLabel = getA11yString(A11yStrings.ARIA_LABEL);
        this.containerEl = document.createElement('div');
        this.containerEl.setAttribute('role', IS_MOBILE ? 'button' : 'application');
        this.containerEl.setAttribute('tabindex', '0');
        this.containerEl.setAttribute('title', getA11yString(A11yStrings.DESCRIPTION));
        this.containerEl.setAttribute('aria-label', ariaLabel);
        this.containerEl.className = RunnerClasses.CONTAINER;
        // Player canvas container.
        const dimensions = this.layoutManager.getDimensions();
        this.canvas = createCanvas(this.containerEl, dimensions.width, dimensions.height);
        this.inputManager = new InputManager(this.containerEl, this.canvas, this.handleInput.bind(this), this.outerContainerEl);
        // Live region for game status updates.
        const a11yStatusEl = document.createElement('span');
        a11yStatusEl.className = 'offline-runner-live-region';
        a11yStatusEl.setAttribute('aria-live', 'assertive');
        a11yStatusEl.textContent = '';
        // Add checkbox to slow down the game.
        const slowSpeedCheckboxLabel = document.createElement('label');
        slowSpeedCheckboxLabel.className = 'slow-speed-option hidden';
        slowSpeedCheckboxLabel.textContent =
            getA11yString(A11yStrings.SPEED_LABEL);
        const slowSpeedCheckbox = document.createElement('input');
        slowSpeedCheckbox.setAttribute('type', 'checkbox');
        slowSpeedCheckbox.setAttribute('title', getA11yString(A11yStrings.SPEED_LABEL));
        slowSpeedCheckbox.setAttribute('tabindex', '0');
        slowSpeedCheckbox.setAttribute('checked', 'checked');
        const slowSpeedToggleEl = document.createElement('span');
        slowSpeedToggleEl.className = 'slow-speed-toggle';
        slowSpeedCheckboxLabel.appendChild(slowSpeedCheckbox);
        slowSpeedCheckboxLabel.appendChild(slowSpeedToggleEl);
        // Set accessibility elements on the manager
        this.accessibilityManager.setA11yElements(a11yStatusEl, slowSpeedCheckboxLabel, slowSpeedCheckbox, slowSpeedToggleEl);
        assert(this.inputManager);
        this.inputManager.setIgnoredKeyTargets([slowSpeedCheckbox]);
        if (IS_IOS) {
            this.outerContainerEl.appendChild(a11yStatusEl);
        }
        else {
            this.containerEl.appendChild(a11yStatusEl);
        }
        const canvasContext = this.canvas.getContext('2d');
        assert(canvasContext);
        this.canvasCtx = canvasContext;
        this.paintBackground();
        updateCanvasScaling(this.canvas);
        // Horizon contains clouds, obstacles and the ground.
        const horizonDimensions = this.layoutManager.getDimensions();
        this.horizon = new Horizon(this.canvas, spriteDef, horizonDimensions, this.config.gapCoefficient, /* resourceProvider= */ this);
        // Distance meter
        const distanceMeterDimensions = this.layoutManager.getDimensions();
        this.distanceMeter = new DistanceMeter(this.canvas, spriteDef.textSprite, distanceMeterDimensions.width, 
        /* imageSpriteProvider= */ this);
        // Draw t-rex
        this.tRex = new Trex(this.canvas, spriteDef.tRex, /* resourceProvider= */ this);
        this.outerContainerEl.appendChild(this.containerEl);
        this.outerContainerEl.appendChild(slowSpeedCheckboxLabel);
        this.startListening();
        this.update();
        window.addEventListener(RunnerEvents.RESIZE, this.debounceResize.bind(this));
        // Handle dark mode (used only when night mode is enabled).
        this.visualEffectsManager.setupDarkModeListener();
    }
    /**
     * Create the touch controller. A div that covers whole screen.
     */
    createTouchController() {
        this.touchController = document.createElement('div');
        this.touchController.className = RunnerClasses.TOUCH_CONTROLLER;
        this.outerContainerEl.appendChild(this.touchController);
        assert(this.inputManager);
        this.inputManager.setTouchController(this.touchController);
    }
    /**
     * Debounce the resize event.
     */
    debounceResize() {
        this.layoutManager.debounceResize(this.adjustDimensions.bind(this));
    }
    /**
     * Adjust game space dimensions on resize.
     */
    adjustDimensions() {
        const callback = {
            updateCanvasSize: (width, height) => {
                if (this.canvas) {
                    this.canvas.width = width;
                    this.canvas.height = height;
                    updateCanvasScaling(this.canvas);
                }
            },
            updateEntities: () => {
                if (this.canvas) {
                    assert(this.distanceMeter);
                    assert(this.horizon);
                    assert(this.tRex);
                    const dimensions = this.layoutManager.getDimensions();
                    this.distanceMeter.calcXpos(dimensions.width);
                    this.clearCanvas();
                    this.horizon.update(0, 0, true, /*showNightMode = */ false);
                    this.tRex.update(0);
                    // Distance meter update
                    if (this.playing || this.crashed || this.paused) {
                        this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                        this.stop();
                    }
                    else {
                        this.tRex.draw(0, 0);
                    }
                    // Game over panel
                    if (this.crashed && this.gameOverPanel) {
                        this.gameOverPanel.updateDimensions(dimensions.width);
                        this.gameOverPanel.draw(this.altGameModeManager.isAltGameModeActive(), this.tRex);
                    }
                }
            }
        };
        this.layoutManager.adjustDimensions(callback, this.playing, this.crashed, this.paused, this.activated);
    }
    /**
     * Play the game intro.
     * Canvas container width expands out to the full width.
     */
    playIntro() {
        if (!this.activated && !this.crashed) {
            assert(this.tRex);
            assert(this.containerEl);
            this.playingIntro = true;
            this.tRex.playingIntro = true;
            // CSS animation definition.
            const introDimensions = this.layoutManager.getDimensions();
            const keyframes = '@-webkit-keyframes intro { ' +
                'from { width:' + this.tRex.config.width + 'px }' +
                'to { width: ' + introDimensions.width + 'px }' +
                '}';
            const styleSheet = document.styleSheets[0];
            assert(styleSheet);
            styleSheet.insertRule(keyframes, 0);
            this.containerEl.addEventListener(RunnerEvents.ANIM_END, this.startGame.bind(this));
            const containerDimensions = this.layoutManager.getDimensions();
            this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
            this.containerEl.style.width = containerDimensions.width + 'px';
            this.setPlayStatus(true);
            this.activated = true;
        }
        else if (this.crashed) {
            this.restart();
        }
    }
    /**
     * Update the game status to started.
     */
    startGame() {
        assert(this.containerEl);
        assert(this.tRex);
        if (this.layoutManager.isArcadeMode()) {
            this.layoutManager.setArcadeMode(RunnerClasses);
        }
        this.accessibilityManager.toggleSpeed(this.getAccessibilityCallbacks());
        this.gameLoopController.setRunningTime(0);
        this.playingIntro = false;
        this.tRex.playingIntro = false;
        this.containerEl.style.webkitAnimation = '';
        this.playCount++;
        if (this.hasAudioCues) {
            this.getGeneratedSoundFx()?.background();
            this.containerEl.setAttribute('title', getA11yString(A11yStrings.JUMP));
        }
        // Handle tabbing off the page. Pause the current game.
        document.addEventListener(RunnerEvents.VISIBILITY, this.onVisibilityChange.bind(this));
        window.addEventListener(RunnerEvents.BLUR, this.onVisibilityChange.bind(this));
        window.addEventListener(RunnerEvents.FOCUS, this.onVisibilityChange.bind(this));
    }
    clearCanvas() {
        assert(this.canvasCtx);
        const dimensions = this.layoutManager.getDimensions();
        this.canvasCtx.clearRect(0, 0, dimensions.width, dimensions.height);
        this.paintBackground();
    }
    paintBackground() {
        assert(this.canvasCtx);
        const dimensions = this.layoutManager.getDimensions();
        const horizonY = Math.floor(dimensions.height * GROUND_SPLIT_RATIO);
        const sunRadius = Math.round(dimensions.height * 0.1);
        const sunGlowRadius = Math.round(dimensions.height * 0.16);
        const pixelSize = Math.max(2, Math.round(dimensions.height * 0.02));
        const now = getTimeStamp();
        const delta = this.sunLastTs ? Math.min(100, now - this.sunLastTs) : 0;
        this.sunLastTs = now;
        if (this.sunX === null) {
            this.sunX = Math.round(dimensions.width * 0.78);
        }
        this.sunX -= delta * SUN_SPEED;
        if (this.sunX + sunGlowRadius < 0) {
            this.sunX = dimensions.width + sunGlowRadius;
        }
        const sunX = Math.round(this.sunX);
        const sunY = Math.round(dimensions.height * 0.22);
        this.canvasCtx.fillStyle = SKY_COLOR;
        this.canvasCtx.fillRect(0, 0, dimensions.width, horizonY);
        const drawPixelCircle = (radius, color, alpha) => {
            this.canvasCtx.save();
            this.canvasCtx.fillStyle = color;
            this.canvasCtx.globalAlpha = alpha;
            for (let y = -radius; y <= radius; y += pixelSize) {
                for (let x = -radius; x <= radius; x += pixelSize) {
                    if (x * x + y * y <= radius * radius) {
                        this.canvasCtx.fillRect(sunX + x, sunY + y, pixelSize, pixelSize);
                    }
                }
            }
            this.canvasCtx.restore();
        };
        drawPixelCircle(sunGlowRadius, SUN_GLOW_COLOR, SUN_GLOW_ALPHA);
        drawPixelCircle(sunRadius, SUN_COLOR, SUN_ALPHA);
        const hillBaseY = Math.round(dimensions.height * 0.58);
        const hillAmp1 = Math.round(dimensions.height * 0.085);
        const hillAmp2 = Math.round(dimensions.height * 0.045);
        const hillStep = Math.max(4, Math.round(dimensions.height * 0.03));
        const hillThickness = Math.max(3, Math.round(dimensions.height * 0.015));
        const speedFactor = this.gameLoopController
            ? this.gameLoopController.getCurrentSpeed() / this.config.speed
            : 1;
        this.hillsOffset += delta * HILLS_SPEED * speedFactor;
        if (this.hillsOffset > dimensions.width * 4) {
            this.hillsOffset = 0;
        }
        this.canvasCtx.save();
        this.canvasCtx.globalAlpha = HILLS_ALPHA;
        this.canvasCtx.fillStyle = HILLS_COLOR;
        for (let x = -hillStep; x <= dimensions.width + hillStep; x += hillStep) {
            const sampleX = x + this.hillsOffset;
            const y = hillBaseY +
                Math.round(Math.sin(sampleX * 0.02) * hillAmp1 +
                    Math.sin(sampleX * 0.009) * hillAmp2);
            this.canvasCtx.fillRect(x, y, hillStep, hillThickness);
        }
        this.canvasCtx.restore();
        this.canvasCtx.fillStyle = GRASS_COLOR;
        this.canvasCtx.fillRect(0, horizonY, dimensions.width, dimensions.height - horizonY);
    }
    /**
     * Checks whether the canvas area is in the viewport of the browser
     * through the current scroll position.
     */
    isCanvasInView() {
        assert(this.containerEl);
        return this.containerEl.getBoundingClientRect().top >
            this.config.canvasInViewOffset;
    }
    /**
     * Main game loop - updates game state and schedules next frame.
     */
    update() {
        assert(this.tRex);
        const now = getTimeStamp();
        let deltaTime = now - (this.gameLoopController.getTime() || now);
        // Update flash timer for alt game mode transitions
        deltaTime = this.altGameModeManager.updateFlashTimer(deltaTime, this.getAltGameModeCallbacks(), () => this.assetManager.getSpriteDef(), this.hasAudioCues);
        this.gameLoopController.setTime(now);
        if (this.playing) {
            assert(this.distanceMeter);
            assert(this.horizon);
            assert(this.canvasCtx);
            this.clearCanvas();
            // Additional fade in - Prevents jump when switching sprites
            this.altGameModeManager.updateFadeIn(deltaTime, this.canvasCtx);
            if (this.tRex.jumping) {
                this.tRex.updateJump(deltaTime);
            }
            this.gameLoopController.setRunningTime(this.gameLoopController.getRunningTime() + deltaTime);
            const hasObstacles = this.gameLoopController.getRunningTime() > this.config.clearTime;
            // First jump triggers the intro.
            if (this.tRex.jumpCount === 1 && !this.playingIntro) {
                this.playIntro();
            }
            // The horizon doesn't move until the intro is over.
            const currentSpeed = this.gameLoopController.getCurrentSpeed();
            if (this.playingIntro) {
                this.horizon.update(0, currentSpeed, hasObstacles, /* showNightMode = */ false);
            }
            else if (!this.crashed) {
                const showNightMode = this.visualEffectsManager.isNightModeEnabled() &&
                    this.visualEffectsManager.isDarkModeActive() !==
                        this.visualEffectsManager.isInverted();
                deltaTime = !this.activated ? 0 : deltaTime;
                this.horizon.update(deltaTime, currentSpeed, hasObstacles, showNightMode);
            }
            const firstObstacle = this.horizon.obstacles[0];
            // Check for collisions.
            let collision = hasObstacles && firstObstacle &&
                this.collisionDetector.checkForCollision(firstObstacle, this.tRex, this.getSpriteDefinition(), this.isAltGameModeEnabled());
            // For a11y, audio cues.
            if (this.hasAudioCues && hasObstacles) {
                assert(firstObstacle);
                const jumpObstacle = firstObstacle.typeConfig.type !== 'collectable';
                if (!firstObstacle.jumpAlerted) {
                    const threshold = this.config.audiocueProximityThreshold;
                    const adjProximityThreshold = threshold +
                        (threshold * Math.log10(currentSpeed / this.config.speed));
                    if (firstObstacle.xPos < adjProximityThreshold) {
                        if (jumpObstacle) {
                            this.getGeneratedSoundFx()?.jump();
                        }
                        firstObstacle.jumpAlerted = true;
                    }
                }
            }
            // Activated alt game mode.
            if (this.isAltGameModeEnabled() && collision && firstObstacle &&
                firstObstacle.typeConfig.type === 'collectable') {
                this.horizon.removeFirstObstacle();
                collision = false;
                this.altGameModeManager.startFlashTimer(this.getAltGameModeCallbacks());
                if (this.hasAudioCues) {
                    this.getGeneratedSoundFx()?.collect();
                }
            }
            if (!collision) {
                this.distanceRan +=
                    currentSpeed * deltaTime / this.gameLoopController.getMsPerFrame();
                if (currentSpeed < this.config.maxSpeed) {
                    this.gameLoopController.setSpeed(currentSpeed + this.config.acceleration);
                }
            }
            else {
                this.gameOver();
            }
            const playAchievementSound = this.distanceMeter.update(deltaTime, Math.ceil(this.distanceRan));
            if (!this.hasAudioCues && playAchievementSound) {
                this.audioManager.playSound(this.audioManager.getSoundFx('SCORE'));
            }
            // Night mode.
            const actualDistance = this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));
            this.visualEffectsManager.updateNightMode(deltaTime, actualDistance, this.isAltGameModeEnabled());
        }
        if (this.playing ||
            (!this.activated && this.tRex.blinkCount < this.config.maxBlinkCount)) {
            this.tRex.update(deltaTime);
            this.scheduleNextUpdate();
        }
    }
    /**
     * Bind relevant key / mouse / touch listeners.
     */
    startListening() {
        assert(this.containerEl);
        assert(this.inputManager);
        this.inputManager.startListening();
        if (!IS_MOBILE) {
            this.containerEl.addEventListener(RunnerEvents.FOCUS, (e) => {
                this.accessibilityManager.showSpeedToggle(this.getAccessibilityCallbacks(), e);
            });
        }
    }
    /**
     * Central input handler.
     */
    handleInput(event) {
        if (event.type === InputEventType.A11Y_ACTIVATE) {
            this.accessibilityManager.enableAudioCues(this.getAccessibilityCallbacks());
            return;
        }
        if (!this.isCanvasInView()) {
            return;
        }
        if (!this.crashed && !this.paused) {
            if (!this.playing) {
                if (event.type === InputEventType.JUMP ||
                    event.type === InputEventType.TOUCH_START) {
                    // Start game
                    if (event.type === InputEventType.TOUCH_START &&
                        !this.touchController) {
                        this.createTouchController();
                    }
                    // Initial logic
                    this.audioManager.loadSounds();
                    this.setPlayStatus(true);
                    this.update();
                    if (window.errorPageController) {
                        window.errorPageController.trackEasterEgg?.();
                    }
                    // Start jump
                    if (this.tRex && !this.tRex.jumping && !this.tRex.ducking) {
                        if (this.hasAudioCues) {
                            this.getGeneratedSoundFx()?.cancelFootSteps();
                        }
                        else {
                            this.audioManager.playSound(this.audioManager.getSoundFx('BUTTON_PRESS'));
                        }
                        this.tRex.startJump(this.gameLoopController.getCurrentSpeed());
                    }
                }
            }
            else {
                // Playing
                if (event.type === InputEventType.JUMP) {
                    if (event.value) {
                        if (this.tRex && !this.tRex.jumping && !this.tRex.ducking) {
                            this.audioManager.playSound(this.audioManager.getSoundFx('BUTTON_PRESS'));
                            this.tRex.startJump(this.gameLoopController.getCurrentSpeed());
                        }
                    }
                    else {
                        if (this.tRex) {
                            this.tRex.endJump();
                        }
                    }
                }
                else if (event.type === InputEventType.DUCK) {
                    if (event.value) {
                        if (this.tRex && this.tRex.jumping) {
                            this.tRex.setSpeedDrop();
                        }
                        else if (this.tRex && !this.tRex.jumping && !this.tRex.ducking) {
                            this.tRex.setDuck(true);
                        }
                    }
                    else {
                        if (this.tRex) {
                            this.tRex.speedDrop = false;
                            this.tRex.setDuck(false);
                        }
                    }
                }
            }
        }
        else if (this.crashed) {
            // Game Over
            const isJumpRelease = event.type === InputEventType.JUMP && event.value === false;
            const isRestartRequest = event.type === InputEventType.RESTART &&
                (event.value === undefined || event.value === false);
            const originalEvent = event.originalEvent;
            const isPointerRelease = isJumpRelease && originalEvent instanceof PointerEvent;
            const isTouchRelease = isJumpRelease && originalEvent instanceof TouchEvent;
            const isKeyboardRelease = isJumpRelease &&
                originalEvent instanceof KeyboardEvent;
            const isGamepadRelease = isJumpRelease && !originalEvent;
            const deltaTime = getTimeStamp() - this.gameLoopController.getTime();
            const canRestartFromJump = (isKeyboardRelease || isGamepadRelease) &&
                deltaTime >= this.config.gameoverClearTime;
            if (isRestartRequest || isPointerRelease || isTouchRelease ||
                canRestartFromJump) {
                this.handleGameOverClicks(originalEvent || new Event(''));
            }
        }
        else if (this.paused && event.type === InputEventType.JUMP &&
            !event.value) {
            if (this.tRex) {
                this.tRex.reset();
            }
            this.play();
        }
    }
    /**
     * Handle interactions on the game over screen state.
     * A user is able to tap the high score twice to reset it.
     */
    handleGameOverClicks(e) {
        if (!this.accessibilityManager.isSlowSpeedCheckbox(e.target)) {
            assert(this.distanceMeter);
            e.preventDefault();
            if (this.distanceMeter.hasClickedOnHighScore(e) && this.scoreManager.getHighestScore()) {
                if (this.distanceMeter.isHighScoreFlashing()) {
                    // Subsequent click, reset the high score.
                    assert(this.distanceMeter);
                    this.scoreManager.saveHighScore(0, this.distanceMeter, true);
                    this.distanceMeter.resetHighScore();
                }
                else {
                    // First click, flash the high score.
                    this.distanceMeter.startHighScoreFlashing();
                }
            }
            else {
                this.distanceMeter.cancelHighScoreFlashing();
                this.restart();
            }
        }
    }
    /**
     * Returns whether the event was a left click on canvas.
     * On Windows right click is registered as a click.
     */
    isLeftClickOnCanvas(e) {
        if (!(e instanceof MouseEvent)) {
            return false;
        }
        return e.button != null && e.button < 2 &&
            e.type === RunnerEvents.POINTERUP &&
            (e.target === this.canvas ||
                (IS_MOBILE && this.hasAudioCues &&
                    e.target === this.containerEl));
    }
    /**
     * RequestAnimationFrame wrapper.
     */
    scheduleNextUpdate() {
        this.gameLoopController.scheduleNextUpdate(this.update.bind(this));
    }
    /**
     * Whether the game is running.
     */
    isRunning() {
        return this.gameLoopController.isRunning();
    }
    /**
     * Game over state.
     */
    gameOver() {
        assert(this.distanceMeter);
        assert(this.tRex);
        assert(this.containerEl);
        this.audioManager.playSound(this.audioManager.getSoundFx('HIT'));
        vibrate(200);
        this.stop();
        this.crashed = true;
        this.distanceMeter.achievement = false;
        this.tRex.update(100, TrexStatus.CRASHED);
        // Game over panel.
        if (!this.gameOverPanel) {
            const origSpriteDef = IS_HIDPI ? spriteDefinitionByType.original.hdpi :
                spriteDefinitionByType.original.ldpi;
            if (this.canvas) {
                const gameOverDimensions = this.layoutManager.getDimensions();
                if (this.isAltGameModeEnabled()) {
                    this.gameOverPanel = new GameOverPanel(this.canvas, origSpriteDef.textSprite, origSpriteDef.restart, gameOverDimensions, /* imageSpriteProvider= */ this, origSpriteDef.altGameEnd, this.altGameModeManager.isAltGameModeActive());
                }
                else {
                    this.gameOverPanel = new GameOverPanel(this.canvas, origSpriteDef.textSprite, origSpriteDef.restart, gameOverDimensions, /* imageSpriteProvider= */ this);
                }
            }
        }
        assert(this.gameOverPanel);
        this.gameOverPanel.draw(this.altGameModeManager.isAltGameModeActive(), this.tRex);
        // Update the high score.
        if (this.distanceRan > this.scoreManager.getHighestScore()) {
            assert(this.distanceMeter);
            this.scoreManager.saveHighScore(this.distanceRan, this.distanceMeter);
        }
        // Reset the time clock.
        this.gameLoopController.setTime(getTimeStamp());
        if (this.hasAudioCues) {
            this.getGeneratedSoundFx()?.stopAll();
            assert(this.containerEl);
            this.accessibilityManager.announcePhrase(getA11yString(A11yStrings.GAME_OVER)
                .replace('$1', this.distanceMeter.getActualDistance(this.distanceRan)
                .toString()) +
                ' ' +
                getA11yString(A11yStrings.HIGH_SCORE)
                    .replace('$1', this.distanceMeter.getActualDistance(this.scoreManager.getHighestScore())
                    .toString()));
            this.containerEl.setAttribute('title', getA11yString(A11yStrings.ARIA_LABEL));
        }
        this.accessibilityManager.showSpeedToggle(this.getAccessibilityCallbacks());
        this.accessibilityManager.disableSpeedToggle(false);
    }
    stop() {
        this.setPlayStatus(false);
        this.paused = true;
        this.gameLoopController.stop();
        if (this.hasAudioCues) {
            this.getGeneratedSoundFx()?.stopAll();
        }
    }
    play() {
        if (!this.crashed) {
            assert(this.tRex);
            this.setPlayStatus(true);
            this.paused = false;
            this.tRex.update(0, TrexStatus.RUNNING);
            this.gameLoopController.setTime(getTimeStamp());
            this.update();
            if (this.hasAudioCues) {
                this.getGeneratedSoundFx()?.background();
            }
        }
    }
    restart() {
        if (!this.gameLoopController.isRunning()) {
            assert(this.containerEl);
            assert(this.gameOverPanel);
            assert(this.tRex);
            assert(this.horizon);
            assert(this.distanceMeter);
            this.playCount++;
            this.gameLoopController.setRunningTime(0);
            this.setPlayStatus(true);
            this.accessibilityManager.toggleSpeed(this.getAccessibilityCallbacks());
            this.paused = false;
            this.crashed = false;
            this.distanceRan = 0;
            this.setSpeed(this.config.speed);
            this.gameLoopController.setTime(getTimeStamp());
            this.containerEl.classList.remove(RunnerClasses.CRASHED);
            this.clearCanvas();
            this.distanceMeter.reset();
            this.horizon.reset();
            this.tRex.reset();
            this.audioManager.playSound(this.audioManager.getSoundFx('BUTTON_PRESS'));
            this.visualEffectsManager.invert(true);
            this.update();
            this.gameOverPanel.reset();
            if (this.hasAudioCues) {
                this.getGeneratedSoundFx()?.background();
            }
            this.containerEl.setAttribute('title', getA11yString(A11yStrings.JUMP));
            this.accessibilityManager.announcePhrase(getA11yString(A11yStrings.STARTED));
        }
    }
    setPlayStatus(isPlaying) {
        if (this.touchController) {
            this.touchController.classList.toggle(HIDDEN_CLASS, !isPlaying);
        }
        this.playing = isPlaying;
    }
    /**
     * Pause the game if the tab is not in focus.
     */
    onVisibilityChange(e) {
        if (document.hidden || e.type === 'blur' ||
            document.visibilityState !== 'visible') {
            this.stop();
        }
        else if (!this.crashed) {
            assert(this.tRex);
            this.tRex.reset();
            this.play();
        }
    }
}
/**
 * Updates the canvas size taking into
 * account the backing store pixel ratio and
 * the device pixel ratio.
 *
 * See article by Paul Lewis:
 * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 *
 * @return Whether the canvas was scaled.
 */
function updateCanvasScaling(canvas, width, height) {
    const context = canvas.getContext('2d');
    assert(context);
    // Query the various pixel ratios
    const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    /** @suppress {missingProperties} */
    const backingStoreRatio = ('webkitBackingStorePixelRatio' in context) ?
        Math.floor(context.webkitBackingStorePixelRatio) :
        1;
    const ratio = devicePixelRatio / backingStoreRatio;
    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
        const oldWidth = width || canvas.width;
        const oldHeight = height || canvas.height;
        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;
        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';
        // Scale the context to counter the fact that we've manually scaled
        // our canvas element.
        context.scale(ratio, ratio);
        return true;
    }
    else if (devicePixelRatio === 1) {
        // Reset the canvas width / height. Fixes scaling bug when the page is
        // zoomed and the devicePixelRatio changes accordingly.
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
    }
    return false;
}
/**
 * Returns a string from loadTimeData data object.
 */
function getA11yString(stringName) {
    return loadTimeData.valueExists(stringName) ?
        loadTimeData.getString(stringName) :
        '';
}
/**
 * Vibrate on mobile devices.
 * @param duration Duration of the vibration in milliseconds.
 */
function vibrate(duration) {
    if (IS_MOBILE && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}
/**
 * Create canvas element.
 * @param container Element to append canvas to.
 */
function createCanvas(container, width, height, classname) {
    const canvas = document.createElement('canvas');
    canvas.className =
        classname ? RunnerClasses.CANVAS + ' ' + classname : RunnerClasses.CANVAS;
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    return canvas;
}
//******************************************************************************
//# sourceMappingURL=runner.js.map
