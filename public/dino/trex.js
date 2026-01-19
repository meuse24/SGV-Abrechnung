// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from './polyfills/js/assert.js';
import { DEFAULT_DIMENSIONS, FPS, IS_HIDPI } from './constants.js';
import { CollisionBox } from './offline_sprite_definitions.js';
import { getTimeStamp } from './utils.js';
/**
 * T-rex player config.
 */
const defaultTrexConfig = {
    dropVelocity: -5,
    flashOff: 175,
    flashOn: 100,
    height: 47,
    heightDuck: 25,
    introDuration: 1500,
    speedDropCoefficient: 3,
    spriteWidth: 262,
    startXPos: 50,
    width: 44,
    widthDuck: 59,
    invertJump: false,
};
const slowJumpConfig = {
    gravity: 0.25,
    maxJumpHeight: 50,
    minJumpHeight: 45,
    initialJumpVelocity: -20,
};
const normalJumpConfig = {
    gravity: 0.6,
    maxJumpHeight: 30,
    minJumpHeight: 30,
    initialJumpVelocity: -10,
};
/**
 * Used in collision detection.
 */
const collisionBoxes = {
    ducking: [new CollisionBox(1, 18, 55, 25)],
    running: [
        new CollisionBox(22, 0, 17, 16),
        new CollisionBox(1, 18, 30, 9),
        new CollisionBox(10, 35, 14, 8),
        new CollisionBox(1, 24, 29, 5),
        new CollisionBox(5, 30, 21, 4),
        new CollisionBox(9, 34, 15, 4),
    ],
};
export var Status;
(function (Status) {
    Status[Status["CRASHED"] = 0] = "CRASHED";
    Status[Status["DUCKING"] = 1] = "DUCKING";
    Status[Status["JUMPING"] = 2] = "JUMPING";
    Status[Status["RUNNING"] = 3] = "RUNNING";
    Status[Status["WAITING"] = 4] = "WAITING";
})(Status || (Status = {}));
/**
 * Blinking coefficient.
 */
const BLINK_TIMING = 7000;
/**
 * Animation config for different states.
 */
const animFrames = {
    [Status.WAITING]: {
        frames: [44, 0],
        msPerFrame: 1000 / 3,
    },
    [Status.RUNNING]: {
        frames: [88, 132],
        msPerFrame: 1000 / 12,
    },
    [Status.CRASHED]: {
        frames: [220],
        msPerFrame: 1000 / 60,
    },
    [Status.JUMPING]: {
        frames: [0],
        msPerFrame: 1000 / 60,
    },
    [Status.DUCKING]: {
        frames: [264, 323],
        msPerFrame: 1000 / 8,
    },
};
export class Trex {
    /**
     * T-rex game character.
     */
    constructor(canvas, spritePos, resourceProvider) {
        this.playingIntro = false;
        this.xPos = 0;
        this.yPos = 0;
        this.jumpCount = 0;
        this.ducking = false;
        this.blinkCount = 0;
        this.jumping = false;
        this.speedDrop = false;
        this.xInitialPos = 0;
        // Position when on the ground.
        this.groundYPos = 0;
        this.currentFrame = 0;
        this.currentAnimFrames = [];
        this.blinkDelay = 0;
        this.animStartTime = 0;
        this.timer = 0;
        this.msPerFrame = 1000 / FPS;
        // Current status.
        this.status = Status.WAITING;
        this.jumpVelocity = 0;
        this.reachedMinHeight = false;
        this.altGameModeEnabled = false;
        this.flashing = false;
        const canvasContext = canvas.getContext('2d');
        assert(canvasContext);
        this.canvasCtx = canvasContext;
        this.spritePos = spritePos;
        this.resourceProvider = resourceProvider;
        this.config = Object.assign(defaultTrexConfig, normalJumpConfig);
        const runnerDefaultDimensions = DEFAULT_DIMENSIONS;
        const runnerBottomPadding = this.resourceProvider.getConfig().bottomPad;
        assert(runnerDefaultDimensions);
        assert(runnerBottomPadding);
        this.groundYPos = runnerDefaultDimensions.height - this.config.height -
            runnerBottomPadding;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.minJumpHeight;
        this.draw(0, 0);
        this.update(0, Status.WAITING);
    }
    /**
     * Assign the appropriate jump parameters based on the game speed.
     */
    enableSlowConfig() {
        const jumpConfig = this.resourceProvider.hasSlowdown ? slowJumpConfig : normalJumpConfig;
        this.config = Object.assign(defaultTrexConfig, jumpConfig);
        this.adjustAltGameConfigForSlowSpeed();
    }
    /**
     * Enables the alternative game. Redefines the dino config.
     * @param spritePos New positioning within image sprite.
     */
    enableAltGameMode(spritePos) {
        this.altGameModeEnabled = true;
        this.spritePos = spritePos;
        const spriteDefinition = this.resourceProvider.getSpriteDefinition();
        assert(spriteDefinition);
        const tRexSpriteDefinition = spriteDefinition.tRex;
        assert(tRexSpriteDefinition.running1);
        const runnerDefaultDimensions = DEFAULT_DIMENSIONS;
        // Update animation frames.
        animFrames[Status.RUNNING].frames =
            [tRexSpriteDefinition.running1.x, tRexSpriteDefinition.running2.x];
        animFrames[Status.CRASHED].frames = [tRexSpriteDefinition.crashed.x];
        if (typeof tRexSpriteDefinition.jumping.x === 'object') {
            animFrames[Status.JUMPING].frames = tRexSpriteDefinition.jumping.x;
        }
        else {
            animFrames[Status.JUMPING].frames = [tRexSpriteDefinition.jumping.x];
        }
        animFrames[Status.DUCKING].frames =
            [tRexSpriteDefinition.ducking1.x, tRexSpriteDefinition.ducking2.x];
        // Update Trex config
        this.config.gravity = tRexSpriteDefinition.gravity || this.config.gravity;
        this.config.height = tRexSpriteDefinition.running1.h,
            this.config.initialJumpVelocity = tRexSpriteDefinition.initialJumpVelocity;
        this.config.maxJumpHeight = tRexSpriteDefinition.maxJumpHeight;
        this.config.minJumpHeight = tRexSpriteDefinition.minJumpHeight;
        this.config.width = tRexSpriteDefinition.running1.w;
        this.config.widthCrashed = tRexSpriteDefinition.crashed.w;
        this.config.widthJump = tRexSpriteDefinition.jumping.w;
        this.config.invertJump = tRexSpriteDefinition.invertJump;
        this.adjustAltGameConfigForSlowSpeed(tRexSpriteDefinition.gravity);
        // Adjust bottom horizon placement.
        this.groundYPos = runnerDefaultDimensions.height - this.config.height -
            spriteDefinition.bottomPad;
        this.yPos = this.groundYPos;
        this.reset();
    }
    /**
     * Slow speeds adjustments for the alt game modes.
     */
    adjustAltGameConfigForSlowSpeed(gravityValue) {
        if (this.resourceProvider.hasSlowdown) {
            if (gravityValue) {
                this.config.gravity = gravityValue / 1.5;
            }
            this.config.minJumpHeight *= 1.5;
            this.config.maxJumpHeight *= 1.5;
            this.config.initialJumpVelocity *= 1.5;
        }
    }
    /**
     * Setter whether dino is flashing.
     */
    setFlashing(status) {
        this.flashing = status;
    }
    /**
     * Setter for the jump velocity.
     * The appropriate drop velocity is also set.
     */
    setJumpVelocity(setting) {
        this.config.initialJumpVelocity = -setting;
        this.config.dropVelocity = -setting / 2;
    }
    /**
     * Set the animation status.
     */
    update(deltaTime, status) {
        this.timer += deltaTime;
        // Update the status.
        if (status !== undefined) {
            this.status = status;
            this.currentFrame = 0;
            this.msPerFrame = animFrames[status].msPerFrame;
            this.currentAnimFrames = animFrames[status].frames;
            if (status === Status.WAITING) {
                this.animStartTime = getTimeStamp();
                this.setBlinkDelay();
            }
        }
        // Game intro animation, T-rex moves in from the left.
        if (this.playingIntro && this.xPos < this.config.startXPos) {
            this.xPos += Math.round((this.config.startXPos / this.config.introDuration) * deltaTime);
            this.xInitialPos = this.xPos;
        }
        if (this.status === Status.WAITING) {
            this.blink(getTimeStamp());
        }
        else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }
        // Update the frame position.
        if (!this.flashing && this.timer >= this.msPerFrame) {
            this.currentFrame =
                this.currentFrame === this.currentAnimFrames.length - 1 ?
                    0 :
                    this.currentFrame + 1;
            this.timer = 0;
        }
        // Speed drop becomes duck if the down key is still being pressed.
        if (this.speedDrop && this.yPos === this.groundYPos) {
            this.speedDrop = false;
            this.setDuck(true);
        }
    }
    /**
     * Draw the t-rex to a particular position.
     */
    draw(x, y) {
        let sourceX = x;
        let sourceY = y;
        let sourceWidth = this.ducking && this.status !== Status.CRASHED ?
            this.config.widthDuck :
            this.config.width;
        let sourceHeight = this.config.height;
        const outputHeight = sourceHeight;
        if (this.altGameModeEnabled) {
            assert(this.config.widthCrashed);
        }
        const outputWidth = this.altGameModeEnabled && this.status === Status.CRASHED ?
            this.config.widthCrashed :
            this.config.width;
        const runnerImageSprite = this.resourceProvider.getRunnerImageSprite();
        assert(runnerImageSprite);
        // Width of sprite can change on jump or crashed.
        if (this.altGameModeEnabled) {
            if (this.jumping && this.status !== Status.CRASHED) {
                assert(this.config.widthJump);
                sourceWidth = this.config.widthJump;
            }
            else if (this.status === Status.CRASHED) {
                assert(this.config.widthCrashed);
                sourceWidth = this.config.widthCrashed;
            }
        }
        if (IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;
        }
        // Adjustments for sprite sheet position.
        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;
        // Flashing.
        if (this.flashing) {
            if (this.timer < this.config.flashOn) {
                this.canvasCtx.globalAlpha = 0.5;
            }
            else if (this.timer > this.config.flashOff) {
                this.timer = 0;
            }
        }
        // Ducking.
        if (this.ducking && this.status !== Status.CRASHED) {
            this.canvasCtx.drawImage(runnerImageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos, this.yPos, this.config.widthDuck, outputHeight);
        }
        else if (this.altGameModeEnabled && this.jumping &&
            this.status !== Status.CRASHED) {
            assert(this.config.widthJump);
            const spriteDefinition = this.resourceProvider.getSpriteDefinition();
            assert(spriteDefinition);
            assert(spriteDefinition.tRex);
            const jumpOffset = spriteDefinition.tRex.jumping.xOffset * (IS_HIDPI ? 2 : 1);
            // Jumping with adjustments.
            this.canvasCtx.drawImage(runnerImageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos - jumpOffset, this.yPos, this.config.widthJump, outputHeight);
        }
        else {
            // Crashed whilst ducking. Trex is standing up so needs adjustment.
            if (this.ducking && this.status === Status.CRASHED) {
                this.xPos++;
            }
            // Standing / running
            this.canvasCtx.drawImage(runnerImageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
        }
        this.canvasCtx.globalAlpha = 1;
    }
    /**
     * Sets a random time for the blink to happen.
     */
    setBlinkDelay() {
        this.blinkDelay = Math.ceil(Math.random() * BLINK_TIMING);
    }
    /**
     * Make t-rex blink at random intervals.
     * @param time Current time in milliseconds.
     */
    blink(time) {
        const deltaTime = time - this.animStartTime;
        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
            if (this.currentFrame === 1) {
                // Set new random delay to blink.
                this.setBlinkDelay();
                this.animStartTime = time;
                this.blinkCount++;
            }
        }
    }
    /**
     * Initialise a jump.
     */
    startJump(speed) {
        if (!this.jumping) {
            this.update(0, Status.JUMPING);
            // Tweak the jump velocity based on the speed.
            this.jumpVelocity = this.config.initialJumpVelocity - (speed / 10);
            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
            if (this.config.invertJump) {
                this.minJumpHeight = this.groundYPos + this.config.minJumpHeight;
            }
        }
    }
    /**
     * Jump is complete, falling down.
     */
    endJump() {
        if (this.reachedMinHeight && this.jumpVelocity < this.config.dropVelocity) {
            this.jumpVelocity = this.config.dropVelocity;
        }
    }
    /**
     * Update frame for a jump.
     */
    updateJump(deltaTime) {
        const msPerFrame = animFrames[this.status].msPerFrame;
        const framesElapsed = deltaTime / msPerFrame;
        // Speed drop makes Trex fall faster.
        if (this.speedDrop) {
            this.yPos += Math.round(this.jumpVelocity * this.config.speedDropCoefficient * framesElapsed);
        }
        else if (this.config.invertJump) {
            this.yPos -= Math.round(this.jumpVelocity * framesElapsed);
        }
        else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }
        this.jumpVelocity += this.config.gravity * framesElapsed;
        // Minimum height has been reached.
        if (this.config.invertJump && (this.yPos > this.minJumpHeight) ||
            !this.config.invertJump && (this.yPos < this.minJumpHeight) ||
            this.speedDrop) {
            this.reachedMinHeight = true;
        }
        // Reached max height.
        if (this.config.invertJump && (this.yPos > -this.config.maxJumpHeight) ||
            !this.config.invertJump && (this.yPos < this.config.maxJumpHeight) ||
            this.speedDrop) {
            this.endJump();
        }
        // Back down at ground level. Jump completed.
        if ((this.config.invertJump && (this.yPos < this.groundYPos)) ||
            (!this.config.invertJump && (this.yPos > this.groundYPos))) {
            this.reset();
            this.jumpCount++;
            if (this.resourceProvider.hasAudioCues) {
                const generatedSoundFx = this.resourceProvider.getGeneratedSoundFx();
                assert(generatedSoundFx);
                generatedSoundFx.loopFootSteps();
            }
        }
    }
    /**
     * Set the speed drop. Immediately cancels the current jump.
     */
    setSpeedDrop() {
        this.speedDrop = true;
        this.jumpVelocity = 1;
    }
    setDuck(isDucking) {
        if (isDucking && this.status !== Status.DUCKING) {
            this.update(0, Status.DUCKING);
            this.ducking = true;
        }
        else if (this.status === Status.DUCKING) {
            this.update(0, Status.RUNNING);
            this.ducking = false;
        }
    }
    /**
     * Reset the t-rex to running at start of game.
     */
    reset() {
        this.xPos = this.xInitialPos;
        this.yPos = this.groundYPos;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.update(0, Status.RUNNING);
        this.speedDrop = false;
        this.jumpCount = 0;
    }
    getCollisionBoxes() {
        return this.ducking ? collisionBoxes.ducking : collisionBoxes.running;
    }
}
//# sourceMappingURL=trex.js.map