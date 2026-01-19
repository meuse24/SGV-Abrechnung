// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { IS_IOS } from '../config/constants.js';
export function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Return the current timestamp.
 */
export function getTimeStamp() {
    return IS_IOS ? new Date().getTime() : performance.now();
}
//# sourceMappingURL=utils.js.map