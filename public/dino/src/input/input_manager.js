// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { IS_MOBILE } from '../config/constants.js';
/**
 * Key code mapping.
 */
const KEYCODES = {
    JUMP: [38, 32], // Up, spacebar
    DUCK: [40], // Down
    RESTART: [13], // Enter
};
const TOUCH_SWIPE_THRESHOLD = 18;
const TOUCH_TAP_DELAY = 60;
export var InputEventType;
(function (InputEventType) {
    InputEventType[InputEventType["JUMP"] = 0] = "JUMP";
    InputEventType[InputEventType["DUCK"] = 1] = "DUCK";
    InputEventType[InputEventType["RESTART"] = 2] = "RESTART";
    InputEventType[InputEventType["TOUCH_START"] = 3] = "TOUCH_START";
    InputEventType[InputEventType["A11Y_ACTIVATE"] = 4] = "A11Y_ACTIVATE";
})(InputEventType || (InputEventType = {}));
export class InputManager {
    constructor(containerEl, canvas, callback, outerContainerEl) {
        this.touchController = null;
        this.pollingGamepads = false;
        this.previousGamepad = null;
        this.ignoredKeyTargets = new Set();
        this.touchDuckActive = false;
        this.touchJumpActive = false;
        this.touchPendingJump = false;
        this.touchJumpTimer = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchSwipeDirection = null;
        this.containerEl = containerEl;
        this.canvas = canvas;
        this.callback = callback;
        this.outerContainerEl = outerContainerEl || null;
    }
    setIgnoredKeyTargets(targets) {
        this.ignoredKeyTargets.clear();
        for (const target of targets) {
            if (target) {
                this.ignoredKeyTargets.add(target);
            }
        }
    }
    setTouchController(controller) {
        this.touchController = controller;
        this.touchController.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.touchController.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.touchController.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    startListening() {
        // Keys.
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.containerEl.addEventListener('keydown', (e) => this.onContainerKeyDown(e));
        // Touch / pointer.
        this.containerEl.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.containerEl.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.containerEl.addEventListener('touchend', (e) => this.onTouchEnd(e));
        if (this.outerContainerEl) {
            this.outerContainerEl.addEventListener('touchstart', (e) => this.onTouchStart(e));
            this.outerContainerEl.addEventListener('touchmove', (e) => this.onTouchMove(e));
            this.outerContainerEl.addEventListener('touchend', (e) => this.onTouchEnd(e));
        }
        document.addEventListener('touchstart', (e) => this.onTouchStart(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
        document.addEventListener('touchend', (e) => this.onTouchEnd(e));
        document.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        document.addEventListener('pointerup', (e) => this.onPointerUp(e));
        document.addEventListener('contextmenu', (e) => this.onContextMenu(e));
        // Gamepad
        window.addEventListener('gamepadconnected', () => this.onGamepadConnected());
        // Prevent scrolling on canvas
        this.canvas.addEventListener('keydown', (e) => this.preventScrolling(e));
        this.canvas.addEventListener('keyup', (e) => this.preventScrolling(e));
    }
    onKeyDown(e) {
        if (this.shouldIgnoreKeyEvent(e)) {
            return;
        }
        if (IS_MOBILE) {
            // Prevent native page scrolling whilst tapping on mobile.
            if (KEYCODES.JUMP.includes(e.keyCode) || KEYCODES.DUCK.includes(e.keyCode)) {
                e.preventDefault();
            }
        }
        if (KEYCODES.JUMP.includes(e.keyCode)) {
            if (!IS_MOBILE)
                e.preventDefault(); // Prevent scrolling
            this.callback({ type: InputEventType.JUMP, value: true, originalEvent: e });
        }
        else if (KEYCODES.DUCK.includes(e.keyCode)) {
            e.preventDefault();
            this.callback({ type: InputEventType.DUCK, value: true, originalEvent: e });
        }
        else if (KEYCODES.RESTART.includes(e.keyCode)) {
            this.callback({ type: InputEventType.RESTART, originalEvent: e });
        }
    }
    onKeyUp(e) {
        if (this.shouldIgnoreKeyEvent(e)) {
            return;
        }
        if (KEYCODES.JUMP.includes(e.keyCode)) {
            this.callback({ type: InputEventType.JUMP, value: false, originalEvent: e });
        }
        else if (KEYCODES.DUCK.includes(e.keyCode)) {
            this.callback({ type: InputEventType.DUCK, value: false, originalEvent: e });
        }
    }
    onContainerKeyDown(e) {
        this.callback({ type: InputEventType.A11Y_ACTIVATE, originalEvent: e });
    }
    onTouchStart(e) {
        if (e.cancelable) {
            e.preventDefault();
        }
        this.callback({ type: InputEventType.TOUCH_START, originalEvent: e });
        const touchCount = e.touches ? e.touches.length : 0;
        if (touchCount >= 2) {
            this.clearTouchJumpTimer();
            this.touchPendingJump = false;
            if (!this.touchDuckActive) {
                this.touchDuckActive = true;
                this.callback({ type: InputEventType.DUCK, value: true, originalEvent: e });
            }
            this.endTouchJump(e);
            return;
        }
        if (this.touchDuckActive) {
            this.touchDuckActive = false;
            this.callback({ type: InputEventType.DUCK, value: false, originalEvent: e });
        }
        const touch = e.touches && e.touches[0];
        if (touch) {
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
        this.touchSwipeDirection = null;
        this.touchPendingJump = true;
        this.clearTouchJumpTimer();
        this.touchJumpTimer = window.setTimeout(() => {
            if (this.touchPendingJump && !this.touchSwipeDirection && !this.touchDuckActive) {
                this.startTouchJump(e);
            }
        }, TOUCH_TAP_DELAY);
    }
    onTouchMove(e) {
        if (e.cancelable) {
            e.preventDefault();
        }
        const touchCount = e.touches ? e.touches.length : 0;
        if (touchCount !== 1) {
            return;
        }
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        if (this.touchSwipeDirection) {
            return;
        }
        if (Math.abs(deltaY) < TOUCH_SWIPE_THRESHOLD || Math.abs(deltaY) < Math.abs(deltaX)) {
            return;
        }
        this.touchPendingJump = false;
        this.clearTouchJumpTimer();
        if (deltaY < 0) {
            this.touchSwipeDirection = 'up';
            this.startTouchJump(e);
        }
        else {
            this.touchSwipeDirection = 'down';
            if (!this.touchDuckActive) {
                this.touchDuckActive = true;
                this.callback({ type: InputEventType.DUCK, value: true, originalEvent: e });
            }
            this.endTouchJump(e);
        }
    }
    onTouchEnd(e) {
        this.clearTouchJumpTimer();
        if (this.touchPendingJump && !this.touchSwipeDirection && !this.touchDuckActive) {
            this.startTouchJump(e);
        }
        this.touchPendingJump = false;
        this.endTouchJump(e);
        const touchCount = e.touches ? e.touches.length : 0;
        if (this.touchDuckActive && touchCount < 2) {
            this.touchDuckActive = false;
            this.callback({ type: InputEventType.DUCK, value: false, originalEvent: e });
        }
        if (touchCount === 0) {
            this.touchSwipeDirection = null;
        }
    }
    onPointerDown(e) {
        if (e.pointerType !== 'mouse' || !this.isPointerEventOnGameArea(e)) {
            return;
        }
        // Check if left click
        if (e.button === 0) {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.callback({ type: InputEventType.JUMP, value: true, originalEvent: e });
            return;
        }
        if (e.button === 2) {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.callback({ type: InputEventType.DUCK, value: true, originalEvent: e });
        }
    }
    onPointerUp(e) {
        if (e.pointerType !== 'mouse' || !this.isPointerEventOnGameArea(e)) {
            return;
        }
        if (e.button === 0) {
            this.callback({ type: InputEventType.JUMP, value: false, originalEvent: e });
            return;
        }
        if (e.button === 2) {
            this.callback({ type: InputEventType.DUCK, value: false, originalEvent: e });
        }
    }
    onContextMenu(e) {
        if (this.isPointerEventOnGameArea(e)) {
            e.preventDefault();
        }
    }
    clearTouchJumpTimer() {
        if (this.touchJumpTimer) {
            clearTimeout(this.touchJumpTimer);
            this.touchJumpTimer = 0;
        }
    }
    startTouchJump(originalEvent) {
        if (this.touchJumpActive) {
            return;
        }
        this.touchJumpActive = true;
        this.callback({ type: InputEventType.JUMP, value: true, originalEvent });
    }
    endTouchJump(originalEvent) {
        if (!this.touchJumpActive) {
            return;
        }
        this.touchJumpActive = false;
        this.callback({ type: InputEventType.JUMP, value: false, originalEvent });
    }
    preventScrolling(e) {
        if (e.keyCode === 32) { // Space
            e.preventDefault();
        }
    }
    shouldIgnoreKeyEvent(e) {
        return this.ignoredKeyTargets.has(e.target);
    }
    isPointerEventOnGameArea(e) {
        const target = e.target;
        if (!(target instanceof Node)) {
            return false;
        }
        if (this.containerEl.contains(target)) {
            return true;
        }
        if (this.outerContainerEl && this.outerContainerEl.contains(target)) {
            return true;
        }
        if (this.touchController && target === this.touchController) {
            return true;
        }
        return document.body.contains(target);
    }
    // --- Gamepad Support ---
    onGamepadConnected() {
        if (!this.pollingGamepads) {
            this.pollGamepadState();
        }
    }
    pollGamepadState() {
        const gamepads = navigator.getGamepads();
        this.pollActiveGamepad(gamepads);
        this.pollingGamepads = true;
        requestAnimationFrame(this.pollGamepadState.bind(this));
    }
    pollForActiveGamepad(gamepads) {
        for (const [i, gamepad] of gamepads.entries()) {
            if (gamepad && gamepad.buttons.length > 0 &&
                gamepad.buttons[0].pressed) {
                this.gamepadIndex = i;
                this.pollActiveGamepad(gamepads);
                return;
            }
        }
    }
    pollActiveGamepad(gamepads) {
        if (this.gamepadIndex === undefined) {
            this.pollForActiveGamepad(gamepads);
            return;
        }
        const gamepad = gamepads[this.gamepadIndex];
        if (!gamepad) {
            this.gamepadIndex = undefined;
            this.pollForActiveGamepad(gamepads);
            return;
        }
        this.processGamepadButton(gamepad, 0, InputEventType.JUMP);
        if (gamepad.buttons.length >= 2) {
            this.processGamepadButton(gamepad, 1, InputEventType.DUCK);
        }
        if (gamepad.buttons.length >= 10) {
            this.processGamepadButton(gamepad, 9, InputEventType.RESTART);
        }
        this.previousGamepad = gamepad;
    }
    processGamepadButton(gamepad, buttonIndex, eventType) {
        const state = gamepad.buttons[buttonIndex]?.pressed || false;
        let previousState = false;
        if (this.previousGamepad) {
            previousState = this.previousGamepad.buttons[buttonIndex]?.pressed || false;
        }
        if (state !== previousState) {
            this.callback({ type: eventType, value: state });
        }
    }
}
//# sourceMappingURL=input_manager.js.map
