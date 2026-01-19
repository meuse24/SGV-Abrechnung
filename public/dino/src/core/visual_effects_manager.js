// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
/**
 * Visual effects manager for night mode and color inversion.
 * Extracted from Runner class for better separation of concerns.
 */
export class VisualEffectsManager {
    constructor(config, runnerClassesEnum, nightModeEnabled = false) {
        this.config = config;
        this.runnerClassesEnum = runnerClassesEnum;
        this.inverted = false;
        this.isDarkMode = false;
        this.nightModeEnabled = false;
        this.invertTimer = 0;
        this.invertTrigger = false;
        this.nightModeEnabled = nightModeEnabled;
    }
    /**
     * Get whether night mode is enabled.
     */
    isNightModeEnabled() {
        return this.nightModeEnabled;
    }
    /**
     * Get whether colors are inverted.
     */
    isInverted() {
        return this.inverted;
    }
    /**
     * Get whether dark mode is active.
     */
    isDarkModeActive() {
        return this.isDarkMode;
    }
    /**
     * Setup dark mode listener for matching OS color scheme.
     * Should be called during initialization.
     */
    setupDarkModeListener() {
        if (this.nightModeEnabled) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.isDarkMode = darkModeMediaQuery && darkModeMediaQuery.matches;
            darkModeMediaQuery.addListener((e) => {
                this.isDarkMode = e.matches;
            });
        }
    }
    /**
     * Update night mode state based on distance and time.
     * @param deltaTime Time delta since last update.
     * @param actualDistance Current actual distance.
     * @param isAltGameMode Whether alt game mode is active.
     */
    updateNightMode(deltaTime, actualDistance, isAltGameMode) {
        if (!isAltGameMode && this.nightModeEnabled) {
            if (this.invertTimer > this.config.invertFadeDuration) {
                this.invertTimer = 0;
                this.invertTrigger = false;
                this.invert(false);
            }
            else if (this.invertTimer) {
                this.invertTimer += deltaTime;
            }
            else {
                if (actualDistance > 0) {
                    this.invertTrigger = !(actualDistance % this.config.invertDistance);
                    if (this.invertTrigger && this.invertTimer === 0) {
                        this.invertTimer += deltaTime;
                        this.invert(false);
                    }
                }
            }
        }
    }
    /**
     * Inverts the current page / canvas colors.
     * @param reset Whether to reset colors.
     */
    invert(reset) {
        const htmlEl = document.firstElementChild;
        assert(htmlEl);
        if (reset) {
            htmlEl.classList.toggle(this.runnerClassesEnum.INVERTED, false);
            this.invertTimer = 0;
            this.inverted = false;
        }
        else {
            this.inverted = htmlEl.classList.toggle(this.runnerClassesEnum.INVERTED, this.invertTrigger);
        }
    }
}
//# sourceMappingURL=visual_effects_manager.js.map