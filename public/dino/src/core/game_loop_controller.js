// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { DEFAULT_DIMENSIONS, FPS } from '../config/constants.js';
/**
 * Game loop controller for managing update timing and speed.
 * Extracted from Runner class for better separation of concerns.
 */
export class GameLoopController {
    constructor(config, hasSlowdown, getDimensions) {
        this.config = config;
        this.hasSlowdown = hasSlowdown;
        this.getDimensions = getDimensions;
        this.raqId = 0;
        this.updatePending = false;
        this.time = 0;
        this.msPerFrame = 1000 / FPS;
        this.runningTime = 0;
        this.currentSpeed = config.speed;
    }
    /**
     * Get the current game time.
     */
    getTime() {
        return this.time;
    }
    /**
     * Set the game time.
     */
    setTime(time) {
        this.time = time;
    }
    /**
     * Get the running time.
     */
    getRunningTime() {
        return this.runningTime;
    }
    /**
     * Set the running time.
     */
    setRunningTime(time) {
        this.runningTime = time;
    }
    /**
     * Get the current speed.
     */
    getCurrentSpeed() {
        return this.currentSpeed;
    }
    /**
     * Get milliseconds per frame.
     */
    getMsPerFrame() {
        return this.msPerFrame;
    }
    /**
     * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
     */
    setSpeed(newSpeed) {
        const speed = newSpeed || this.currentSpeed;
        // Reduce the speed on smaller mobile screens.
        const dimensions = this.getDimensions();
        if (dimensions.width < DEFAULT_DIMENSIONS.width) {
            const mobileSpeed = this.hasSlowdown ? speed :
                speed * dimensions.width /
                    DEFAULT_DIMENSIONS.width * this.config.mobileSpeedCoefficient;
            this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
        }
        else if (newSpeed) {
            this.currentSpeed = newSpeed;
        }
    }
    /**
     * RequestAnimationFrame wrapper.
     * @param updateCallback Callback to execute on each frame.
     */
    scheduleNextUpdate(updateCallback) {
        if (!this.updatePending) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(() => {
                this.updatePending = false;
                updateCallback();
            });
        }
    }
    /**
     * Whether the game is running.
     */
    isRunning() {
        return !!this.raqId;
    }
    /**
     * Stop the game loop.
     */
    stop() {
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
    }
    /**
     * Reset the request animation frame ID (for restart).
     */
    resetRaqId() {
        this.raqId = 0;
    }
    /**
     * Get the current request animation frame ID.
     */
    getRaqId() {
        return this.raqId;
    }
}
//# sourceMappingURL=game_loop_controller.js.map