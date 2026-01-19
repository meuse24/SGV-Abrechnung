// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { loadTimeData } from '../../polyfills/js/load_time_data.js';
import { GAME_TYPE } from '../config/offline_sprite_definitions.js';
/**
 * Alt game mode manager for handling alternative game types.
 * Extracted from Runner class for better separation of concerns.
 */
export class AltGameModeManager {
    constructor(config) {
        this.config = config;
        this.gameType = null;
        this.altGameModeActive = false;
        this.altGameModeFlashTimer = null;
        this.fadeInTimer = 0;
    }
    /**
     * Initialize alternative game type.
     */
    initAltGameType() {
        assert(loadTimeData.valueExists('altGameType'));
        if (GAME_TYPE.length > 0) {
            const parsedValue = Number.parseInt(loadTimeData.getValue('altGameType'), 10);
            const type = GAME_TYPE[parsedValue - 1];
            this.gameType = type || null;
        }
    }
    /**
     * Get the current game type.
     */
    getGameType() {
        return this.gameType;
    }
    /**
     * Whether alt game mode is currently active.
     */
    isAltGameModeActive() {
        return this.altGameModeActive;
    }
    /**
     * Get the fade-in timer value.
     */
    getFadeInTimer() {
        return this.fadeInTimer;
    }
    /**
     * Start the flash timer when collecting a collectable.
     */
    startFlashTimer(callbacks) {
        this.altGameModeFlashTimer = this.config.flashDuration;
        callbacks.setTRexFlashing(true);
        callbacks.resetRunningTime();
    }
    /**
     * Update the flash timer and enable alt game mode when ready.
     * @param deltaTime Time delta since last update.
     * @param callbacks Callbacks for enabling alt game mode.
     * @param getSpriteDef Function to get the sprite definition.
     * @param hasAudioCues Whether audio cues are enabled.
     * @returns Updated delta time (0 if flashing, original otherwise).
     */
    updateFlashTimer(deltaTime, callbacks, getSpriteDef, hasAudioCues) {
        if (this.altGameModeFlashTimer !== null) {
            if (this.altGameModeFlashTimer <= 0) {
                this.altGameModeFlashTimer = null;
                callbacks.setTRexFlashing(false);
                this.enableAltGameMode(callbacks, getSpriteDef, hasAudioCues);
            }
            else if (this.altGameModeFlashTimer > 0) {
                this.altGameModeFlashTimer -= deltaTime;
                callbacks.updateTRex(deltaTime);
                return 0; // Return 0 to pause other updates
            }
        }
        return deltaTime;
    }
    /**
     * Enable the alt game mode. Switching out the sprites.
     */
    enableAltGameMode(callbacks, getSpriteDef, hasAudioCues) {
        callbacks.switchToAltGameSprite();
        assert(this.gameType);
        const spriteDef = getSpriteDef();
        assert(spriteDef);
        this.altGameModeActive = true;
        callbacks.enableAltGameModeOnTRex(spriteDef.tRex);
        callbacks.enableAltGameModeOnHorizon(spriteDef);
        if (hasAudioCues) {
            callbacks.playBackgroundSound();
        }
    }
    /**
     * Update fade-in effect for canvas alpha.
     * @param deltaTime Time delta since last update.
     * @param canvasCtx Canvas rendering context.
     */
    updateFadeIn(deltaTime, canvasCtx) {
        if (this.altGameModeActive &&
            this.fadeInTimer <= this.config.fadeDuration) {
            this.fadeInTimer += deltaTime / 1000;
            canvasCtx.globalAlpha = this.fadeInTimer;
        }
        else {
            canvasCtx.globalAlpha = 1;
        }
    }
}
//# sourceMappingURL=alt_game_mode_manager.js.map