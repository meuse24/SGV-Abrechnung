// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from '../../polyfills/js/assert.js';
import { CollisionBox } from '../config/offline_sprite_definitions.js';
/**
 * Collision detection for the T-Rex game.
 * Extracted from Runner class for better separation of concerns.
 */
export class CollisionDetector {
    /**
     * Check for collision between T-Rex and obstacle.
     * @param obstacle The obstacle to check against.
     * @param tRex The T-Rex player character.
     * @param spriteDefinition Sprite definitions for alt game mode.
     * @param isAltGameModeEnabled Whether alt game mode is active.
     * @param canvasCtx Optional canvas context for drawing collision boxes.
     * @return Collision boxes if collision detected, null otherwise.
     */
    checkForCollision(obstacle, tRex, spriteDefinition, isAltGameModeEnabled, canvasCtx) {
        // Adjustments are made to the bounding box as there is a 1 pixel white
        // border around the t-rex and obstacles.
        const tRexBox = new CollisionBox(tRex.xPos + 1, tRex.yPos + 1, tRex.config.width - 2, tRex.config.height - 2);
        const obstacleBox = new CollisionBox(obstacle.xPos + 1, obstacle.yPos + 1, obstacle.typeConfig.width * obstacle.size - 2, obstacle.typeConfig.height - 2);
        // Debug outer box
        if (canvasCtx) {
            drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox);
        }
        // Simple outer bounds check.
        if (boxCompare(tRexBox, obstacleBox)) {
            const collisionBoxes = obstacle.collisionBoxes;
            let tRexCollisionBoxes = [];
            if (isAltGameModeEnabled) {
                assert(spriteDefinition);
                assert(spriteDefinition.tRex);
                tRexCollisionBoxes = spriteDefinition.tRex.collisionBoxes;
            }
            else {
                tRexCollisionBoxes = tRex.getCollisionBoxes();
            }
            // Detailed axis aligned box check.
            for (const tRexCollisionBox of tRexCollisionBoxes) {
                for (const obstacleCollisionBox of collisionBoxes) {
                    // Adjust the box to actual positions.
                    const adjTrexBox = createAdjustedCollisionBox(tRexCollisionBox, tRexBox);
                    const adjObstacleBox = createAdjustedCollisionBox(obstacleCollisionBox, obstacleBox);
                    const crashed = boxCompare(adjTrexBox, adjObstacleBox);
                    // Draw boxes for debug.
                    if (canvasCtx) {
                        drawCollisionBoxes(canvasCtx, adjTrexBox, adjObstacleBox);
                    }
                    if (crashed) {
                        return [adjTrexBox, adjObstacleBox];
                    }
                }
            }
        }
        return null;
    }
}
/**
 * Adjust the collision box.
 * @param box The original box.
 * @param adjustment Adjustment box.
 * @return The adjusted collision box object.
 */
function createAdjustedCollisionBox(box, adjustment) {
    return new CollisionBox(box.x + adjustment.x, box.y + adjustment.y, box.width, box.height);
}
/**
 * Draw the collision boxes for debug.
 */
function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
    canvasCtx.save();
    canvasCtx.strokeStyle = '#f00';
    canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);
    canvasCtx.strokeStyle = '#0f0';
    canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y, obstacleBox.width, obstacleBox.height);
    canvasCtx.restore();
}
/**
 * Compare two collision boxes for a collision.
 * @return Whether the boxes intersected.
 */
function boxCompare(tRexBox, obstacleBox) {
    const tRexBoxX = tRexBox.x;
    const tRexBoxY = tRexBox.y;
    const obstacleBoxX = obstacleBox.x;
    const obstacleBoxY = obstacleBox.y;
    // Axis-Aligned Bounding Box method.
    if (tRexBoxX < obstacleBoxX + obstacleBox.width &&
        tRexBoxX + tRexBox.width > obstacleBoxX &&
        tRexBoxY < obstacleBoxY + obstacleBox.height &&
        tRexBox.height + tRexBoxY > obstacleBoxY) {
        return true;
    }
    return false;
}
//# sourceMappingURL=collision_detector.js.map