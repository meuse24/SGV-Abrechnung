/**
 * Browser polyfill for chrome://resources/js/assert.js
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}
export function assertInstanceof(value, type, message) {
    if (!(value instanceof type)) {
        throw new Error(message ||
            `Value ${value} is not instance of ${type.name || type}`);
    }
    return value;
}
export function assertNotReached(message = 'Unreachable code hit') {
    throw new Error(message);
}
//# sourceMappingURL=assert.js.map