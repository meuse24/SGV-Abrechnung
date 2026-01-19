// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { IS_HIDPI } from '../config/constants.js';
import { getRandomNum } from '../utils/utils.js';
export class Cloud {
    /**
     * Cloud background item.
     * Similar to an obstacle object but without collision boxes.
     */
    constructor(canvas, spritePos, containerWidth, imageSpriteProvider) {
        this.remove = false;
        this.yPos = 0;
        const canvasContext = canvas.getContext('2d');
        assert(canvasContext);
        this.canvasCtx = canvasContext;
        this.xPos = containerWidth;
        this.spritePos = spritePos;
        this.imageSpriteProvider = imageSpriteProvider;
        this.gap = getRandomNum(Config.MIN_CLOUD_GAP, Config.MAX_CLOUD_GAP);
        this.init();
    }
    /**
     * Initialise the cloud. Sets the Cloud height.
     */
    init() {
        this.yPos = getRandomNum(Config.MAX_SKY_LEVEL, Config.MIN_SKY_LEVEL);
        this.draw();
    }
    /**
     * Draw the cloud.
     */
    draw() {
        const runnerImageSprite = this.imageSpriteProvider.getRunnerImageSprite();
        this.canvasCtx.save();
        // Apply blue color filter to clouds
        this.canvasCtx.filter = 'sepia(100%) saturate(500%) brightness(70%) hue-rotate(180deg)';
        let sourceWidth = Config.WIDTH;
        let sourceHeight = Config.HEIGHT;
        const outputWidth = sourceWidth;
        const outputHeight = sourceHeight;
        if (IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
        this.canvasCtx.drawImage(runnerImageSprite, this.spritePos.x, this.spritePos.y, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
        this.canvasCtx.restore();
    }
    /**
     * Update the cloud position.
     */
    update(speed) {
        if (!this.remove) {
            this.xPos -= Math.ceil(speed);
            this.draw();
            // Mark as removable if no longer in the canvas.
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }
    /**
     * Check if the cloud is visible on the stage.
     */
    isVisible() {
        return this.xPos + Config.WIDTH > 0;
    }
}
/**
 * Cloud object config.
 */
var Config;
(function (Config) {
    Config[Config["HEIGHT"] = 14] = "HEIGHT";
    Config[Config["MAX_CLOUD_GAP"] = 400] = "MAX_CLOUD_GAP";
    Config[Config["MAX_SKY_LEVEL"] = 30] = "MAX_SKY_LEVEL";
    Config[Config["MIN_CLOUD_GAP"] = 100] = "MIN_CLOUD_GAP";
    Config[Config["MIN_SKY_LEVEL"] = 71] = "MIN_SKY_LEVEL";
    Config[Config["WIDTH"] = 46] = "WIDTH";
})(Config || (Config = {}));
//# sourceMappingURL=cloud.js.map