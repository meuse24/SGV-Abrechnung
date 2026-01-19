// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { loadTimeData } from '../../polyfills/js/load_time_data.js';
import { IS_HIDPI } from '../config/constants.js';
import { spriteDefinitionByType } from '../config/offline_sprite_definitions.js';
const RESOURCE_POSTFIX = 'offline-resources-';
/**
 * Asset manager for loading and managing sprite images and sounds.
 * Extracted from Runner class for better separation of concerns.
 */
export class AssetManager {
    constructor(gameType) {
        this.gameType = gameType;
        this.origImageSprite = null;
        this.altCommonImageSprite = null;
        this.altGameImageSprite = null;
        this.imageSprite = null;
        this.spriteDef = null;
        this.altGameAssetsFailedToLoad = false;
        this.spriteDefinition = gameType ?
            spriteDefinitionByType[gameType] :
            spriteDefinitionByType.original;
    }
    /**
     * Create an image element from loadTimeData.
     * @param resourceName Name in data object.
     * @return The created element.
     */
    createImageElement(resourceName) {
        const imgSrc = loadTimeData.valueExists(resourceName) ?
            loadTimeData.getString(resourceName) :
            null;
        if (imgSrc) {
            const el = document.createElement('img');
            el.id = resourceName;
            el.src = imgSrc;
            const resourcesElement = document.getElementById('offline-resources');
            assert(resourcesElement);
            resourcesElement.appendChild(el);
            return el;
        }
        return null;
    }
    /**
     * Cache the appropriate image sprite from the page and get the sprite sheet
     * definition.
     * @param onLoadCallback Callback to invoke when images are loaded.
     */
    loadImages(onLoadCallback) {
        let scale = '1x';
        this.spriteDef = this.getSpriteDefinition().ldpi;
        if (IS_HIDPI) {
            scale = '2x';
            this.spriteDef = this.getSpriteDefinition().hdpi;
        }
        const imageSpriteElement = document.querySelector(`#${RESOURCE_POSTFIX + scale}`);
        assert(imageSpriteElement);
        this.imageSprite = imageSpriteElement;
        if (this.gameType) {
            this.altGameImageSprite =
                this.createImageElement('altGameSpecificImage' + scale);
            this.altCommonImageSprite =
                this.createImageElement('altGameCommonImage' + scale);
        }
        this.origImageSprite = this.getRunnerImageSprite();
        // Disable the alt game mode if the sprites can't be loaded.
        if (this.getRunnerAltGameImageSprite() === null ||
            this.getAltCommonImageSprite() === null) {
            this.altGameAssetsFailedToLoad = true;
        }
        if (this.getRunnerImageSprite().complete) {
            onLoadCallback();
        }
        else {
            // If the images are not yet loaded, add a listener.
            this.getRunnerImageSprite().addEventListener('load', onLoadCallback);
        }
    }
    /**
     * Switch to using alt game sprite.
     */
    switchToAltGameSprite() {
        assert(this.altGameImageSprite);
        this.imageSprite = this.altGameImageSprite;
    }
    /**
     * Get the sprite definition for the current game type.
     */
    getSpriteDef() {
        return this.spriteDef;
    }
    /**
     * Whether alt game assets failed to load.
     */
    hasAltGameAssetsFailedToLoad() {
        return this.altGameAssetsFailedToLoad;
    }
    // ImageSpriteProvider implementation
    getSpriteDefinition() {
        return this.spriteDefinition;
    }
    getOrigImageSprite() {
        assert(this.origImageSprite);
        return this.origImageSprite;
    }
    getRunnerImageSprite() {
        assert(this.imageSprite);
        return this.imageSprite;
    }
    getRunnerAltGameImageSprite() {
        return this.altGameImageSprite;
    }
    getAltCommonImageSprite() {
        return this.altCommonImageSprite;
    }
}
//# sourceMappingURL=asset_manager.js.map