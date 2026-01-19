// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/**
 * Score manager for tracking and persisting high scores.
 * Extracted from Runner class for better separation of concerns.
 */
export class ScoreManager {
    constructor() {
        this.highestScore = 0;
        this.syncHighestScore = false;
    }
    /**
     * Set the initial high score as stored in the user's profile.
     * @param highScore The initial high score.
     * @param distanceMeter Distance meter to update with the high score.
     */
    initializeHighScore(highScore, distanceMeter) {
        this.syncHighestScore = true;
        highScore = Math.ceil(highScore);
        if (highScore < this.highestScore) {
            if (window.errorPageController) {
                window.errorPageController.updateEasterEggHighScore?.(this.highestScore);
            }
            return;
        }
        this.highestScore = highScore;
        distanceMeter.setHighScore(this.highestScore);
    }
    /**
     * Sets the current high score and saves to the profile if available.
     * @param distanceRan Total distance ran.
     * @param distanceMeter Distance meter to update with the high score.
     * @param resetScore Whether to reset the score.
     */
    saveHighScore(distanceRan, distanceMeter, resetScore) {
        this.highestScore = Math.ceil(distanceRan);
        distanceMeter.setHighScore(this.highestScore);
        // Store the new high score in the profile.
        if (this.syncHighestScore && window.errorPageController) {
            if (resetScore) {
                window.errorPageController.resetEasterEgg?.();
            }
            else {
                window.errorPageController.updateEasterEggHighScore?.(this.highestScore);
            }
        }
    }
    /**
     * Get the current highest score.
     */
    getHighestScore() {
        return this.highestScore;
    }
    /**
     * Whether to sync the highest score with external storage.
     */
    shouldSyncHighScore() {
        return this.syncHighestScore;
    }
    /**
     * Set whether to sync the highest score.
     */
    setSyncHighScore(value) {
        this.syncHighestScore = value;
    }
}
//# sourceMappingURL=score_manager.js.map