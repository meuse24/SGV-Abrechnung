// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
/**
 * Accessibility manager for screen reader support and speed toggle.
 * Extracted from Runner class for better separation of concerns.
 * Implements GameStateProvider interface for external consumers.
 */
export class AccessibilityManager {
    constructor(config, defaultBaseConfig, normalModeConfig, slowModeConfig) {
        this.config = config;
        this.defaultBaseConfig = defaultBaseConfig;
        this.normalModeConfig = normalModeConfig;
        this.slowModeConfig = slowModeConfig;
        this.a11yStatusEl = null;
        this.slowSpeedCheckboxLabel = null;
        this.slowSpeedCheckbox = null;
        this.slowSpeedToggleEl = null;
        this.hasSlowdownInternal = false;
        this.hasAudioCuesInternal = false;
        this.isAltGameModeEnabledCallback = null;
    }
    /**
     * Set the callback for checking if alt game mode is enabled.
     */
    setIsAltGameModeEnabledCallback(callback) {
        this.isAltGameModeEnabledCallback = callback;
    }
    /**
     * GameStateProvider implementation: Get whether slowdown is active.
     */
    get hasSlowdown() {
        return this.hasSlowdownInternal;
    }
    /**
     * GameStateProvider implementation: Get whether audio cues are enabled.
     */
    get hasAudioCues() {
        return this.hasAudioCuesInternal;
    }
    /**
     * GameStateProvider implementation: Check if alt game mode is enabled.
     * Delegates to the callback.
     */
    isAltGameModeEnabled() {
        return this.isAltGameModeEnabledCallback ? this.isAltGameModeEnabledCallback() : false;
    }
    /**
     * Set the DOM elements for accessibility features.
     */
    setA11yElements(a11yStatusEl, slowSpeedCheckboxLabel, slowSpeedCheckbox, slowSpeedToggleEl) {
        this.a11yStatusEl = a11yStatusEl;
        this.slowSpeedCheckboxLabel = slowSpeedCheckboxLabel;
        this.slowSpeedCheckbox = slowSpeedCheckbox;
        this.slowSpeedToggleEl = slowSpeedToggleEl;
    }
    /**
     * Check if the event target is the slow speed checkbox.
     */
    isSlowSpeedCheckbox(target) {
        return target === this.slowSpeedCheckbox;
    }
    /**
     * For screen readers make an announcement to the live region.
     * @param phrase Sentence to speak.
     */
    announcePhrase(phrase) {
        if (this.a11yStatusEl) {
            this.a11yStatusEl.textContent = '';
            this.a11yStatusEl.textContent = phrase;
        }
    }
    /**
     * Toggle between normal and slow speed modes.
     */
    toggleSpeed(callbacks) {
        if (this.hasAudioCuesInternal) {
            assert(this.slowSpeedCheckbox);
            const speedChange = this.hasSlowdown !== this.slowSpeedCheckbox.checked;
            if (speedChange) {
                this.hasSlowdownInternal = this.slowSpeedCheckbox.checked;
                const updatedConfig = this.hasSlowdown ? this.slowModeConfig : this.normalModeConfig;
                this.config = Object.assign(this.defaultBaseConfig, updatedConfig);
                callbacks.updateConfig(this.config);
                callbacks.setSpeed(updatedConfig.speed);
                callbacks.enableSlowConfigOnTRex();
                callbacks.adjustObstacleSpeed();
            }
            if (callbacks.isPlaying()) {
                this.disableSpeedToggle(true);
            }
        }
    }
    /**
     * Show the speed toggle.
     * From focus event or when audio cues are activated.
     */
    showSpeedToggle(callbacks, e) {
        const isFocusEvent = e && e.type === 'focus';
        if (this.hasAudioCuesInternal || isFocusEvent) {
            assert(this.slowSpeedCheckboxLabel);
            const HIDDEN_CLASS = 'hidden';
            this.slowSpeedCheckboxLabel.classList.toggle(HIDDEN_CLASS, isFocusEvent ? false : !callbacks.isCrashed());
        }
    }
    /**
     * Disable the speed toggle.
     */
    disableSpeedToggle(disable) {
        assert(this.slowSpeedCheckbox);
        if (disable) {
            this.slowSpeedCheckbox.setAttribute('disabled', 'disabled');
        }
        else {
            this.slowSpeedCheckbox.removeAttribute('disabled');
        }
    }
    /**
     * Enable audio cues for accessibility.
     */
    enableAudioCues(callbacks) {
        if (callbacks.isActivated() || this.hasAudioCuesInternal) {
            return;
        }
        this.hasAudioCuesInternal = true;
        callbacks.enableGeneratedSoundFx();
        this.config.clearTime *= 1.2;
        this.toggleSpeed(callbacks);
    }
    /**
     * Update the config reference when it changes externally.
     */
    updateConfig(config) {
        this.config = config;
    }
}
//# sourceMappingURL=accessibility_manager.js.map