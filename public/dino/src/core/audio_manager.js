// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { IS_IOS } from '../config/constants.js';
import { GeneratedSoundFx } from '../audio/generated_sound_fx.js';
/**
 * Sound FX. Reference to the ID of the audio tag on interstitial page.
 */
var RunnerSounds;
(function (RunnerSounds) {
    RunnerSounds["BUTTON_PRESS"] = "offline-sound-press";
    RunnerSounds["HIT"] = "offline-sound-hit";
    RunnerSounds["SCORE"] = "offline-sound-reached";
})(RunnerSounds || (RunnerSounds = {}));
/**
 * Audio manager for loading and playing sound effects.
 * Extracted from Runner class for better separation of concerns.
 */
export class AudioManager {
    constructor(config) {
        this.config = config;
        this.soundFx = {};
        this.audioContext = null;
        this.generatedSoundFx = null;
    }
    /**
     * Load and decode base 64 encoded sounds.
     */
    loadSounds() {
        if (IS_IOS) {
            return;
        }
        this.audioContext = new AudioContext();
        const resourceTemplateElement = document.querySelector(`#${this.config.resourceTemplateId}`);
        assert(resourceTemplateElement);
        const resourceTemplate = resourceTemplateElement.content;
        for (const sound in RunnerSounds) {
            const audioElement = resourceTemplate.querySelector(`#${RunnerSounds[sound]}`);
            // If no audio elements found, skip loading (will use Web Audio API fallback)
            if (!audioElement) {
                return;
            }
            let soundSrc = audioElement.src;
            soundSrc = soundSrc.substring(soundSrc.indexOf(',') + 1);
            const buffer = decodeBase64ToArrayBuffer(soundSrc);
            // Async, so no guarantee of order in array.
            this.audioContext.decodeAudioData(buffer, audioBuffer => {
                this.soundFx = {
                    ...this.soundFx,
                    [sound]: audioBuffer,
                };
            });
        }
    }
    /**
     * Play a sound.
     */
    playSound(soundBuffer) {
        if (soundBuffer) {
            assert(this.audioContext);
            const sourceNode = this.audioContext.createBufferSource();
            sourceNode.buffer = soundBuffer;
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(0);
        }
        else if (this.audioContext) {
            // Fallback: Generate simple beep sound if no audio buffer
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = 800; // 800 Hz beep
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        }
    }
    /**
     * Enable generated sound effects for accessibility features.
     */
    enableGeneratedSoundFx() {
        this.generatedSoundFx = new GeneratedSoundFx();
    }
    /**
     * Get the generated sound FX instance.
     */
    getGeneratedSoundFx() {
        return this.generatedSoundFx;
    }
    /**
     * Get a specific sound effect buffer.
     */
    getSoundFx(sound) {
        return this.soundFx[sound];
    }
}
/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 */
function decodeBase64ToArrayBuffer(base64String) {
    const len = (base64String.length / 4) * 3;
    const str = atob(base64String);
    const arrayBuffer = new ArrayBuffer(len);
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
}
//# sourceMappingURL=audio_manager.js.map