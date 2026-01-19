// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { DEFAULT_DIMENSIONS, IS_RTL } from '../config/constants.js';
const ARCADE_MODE_URL = 'chrome://dino/';
/**
 * Layout manager for handling canvas dimensions and arcade mode.
 * Extracted from Runner class for better separation of concerns.
 */
export class LayoutManager {
    constructor(outerContainerEl, containerEl, config) {
        this.outerContainerEl = outerContainerEl;
        this.containerEl = containerEl;
        this.config = config;
        this.dimensions = DEFAULT_DIMENSIONS;
    }
    /**
     * Get the current dimensions.
     */
    getDimensions() {
        return this.dimensions;
    }
    /**
     * Debounce the resize event.
     * @param adjustCallback Callback to call when debounce timer fires.
     */
    debounceResize(adjustCallback) {
        if (this.resizeTimerId === undefined) {
            this.resizeTimerId = setInterval(adjustCallback, 250);
        }
    }
    /**
     * Adjust game space dimensions on resize.
     * @param callback Callback to update canvas and entities.
     * @param playing Whether the game is currently playing.
     * @param crashed Whether the game has crashed.
     * @param paused Whether the game is paused.
     * @param activated Whether the game has been activated.
     */
    adjustDimensions(callback, playing, crashed, paused, activated) {
        clearInterval(this.resizeTimerId);
        this.resizeTimerId = undefined;
        const boxStyles = window.getComputedStyle(this.outerContainerEl);
        const padding = Number(boxStyles.paddingLeft.slice(0, -2));
        this.dimensions.width = this.outerContainerEl.offsetWidth - padding * 2;
        if (this.isArcadeMode()) {
            this.dimensions.width =
                Math.min(DEFAULT_DIMENSIONS.width, this.dimensions.width);
            if (activated) {
                this.setArcadeModeContainerScale();
            }
        }
        // Update canvas size
        callback.updateCanvasSize(this.dimensions.width, this.dimensions.height);
        // Outer container dimensions
        if (playing || crashed || paused) {
            assert(this.containerEl);
            this.containerEl.style.width = this.dimensions.width + 'px';
            this.containerEl.style.height = this.dimensions.height + 'px';
        }
        // Update entities (distance meter, horizon, trex, game over panel)
        callback.updateEntities();
    }
    /**
     * Whether the game should go into arcade mode.
     */
    isArcadeMode() {
        // In RTL languages the title is wrapped with the left to right mark
        // control characters &#x202A; and &#x202C but are invisible.
        return IS_RTL ? document.title.indexOf(ARCADE_MODE_URL) === 1 :
            document.title === ARCADE_MODE_URL;
    }
    /**
     * Hides offline messaging for a fullscreen game only experience.
     */
    setArcadeMode(runnerClassesEnum) {
        document.body.classList.add(runnerClassesEnum.ARCADE_MODE);
        this.setArcadeModeContainerScale();
    }
    /**
     * Sets the scaling for arcade mode.
     */
    setArcadeModeContainerScale() {
        assert(this.containerEl);
        const windowHeight = window.innerHeight;
        const scaleHeight = windowHeight / this.dimensions.height;
        const scaleWidth = window.innerWidth / this.dimensions.width;
        const scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
        const scaledCanvasHeight = this.dimensions.height * scale;
        // Positions the game container at 10% of the available vertical window
        // height minus the game container height.
        const translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
            this.config.arcadeModeInitialTopPosition) *
            this.config.arcadeModeTopPositionPercent)) *
            window.devicePixelRatio;
        const cssScale = IS_RTL ? -scale + ',' + scale : scale;
        this.containerEl.style.transform =
            'scale(' + cssScale + ') translateY(' + translateY + 'px)';
    }
    /**
     * Get the width for mobile speed adjustment calculations.
     */
    getWidth() {
        return this.dimensions.width;
    }
}
//# sourceMappingURL=layout_manager.js.map