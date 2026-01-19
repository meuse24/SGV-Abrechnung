/**
 * Browser polyfill for chrome://resources/js/load_time_data.js
 * Simulates Chrome's loadTimeData API for standalone browser usage
 */
class LoadTimeData {
    constructor() {
        this.data = new Map();
        // Default configuration for the dino game
        // NOTE: Do NOT set 'disabledEasterEgg' - it should not exist to enable the game
        // this.data.set('disabledEasterEgg', '');  // REMOVED - would disable the game
        this.data.set('altGameType', '0');
        // Accessibility strings
        this.data.set('dinoGameA11yAriaLabel', 'Dino game');
        this.data.set('dinoGameA11yDescription', 'Use Space or Up Arrow to jump, Down Arrow to duck');
        this.data.set('dinoGameA11yGameOver', 'Game over');
        this.data.set('dinoGameA11yHighScore', 'High score');
        this.data.set('dinoGameA11yJump', 'Jump');
        this.data.set('dinoGameA11yStartGame', 'Game started');
        this.data.set('dinoGameA11ySpeedToggle', 'Speed toggle');
    }
    valueExists(key) {
        return this.data.has(key);
    }
    getValue(key) {
        if (!this.data.has(key)) {
            throw new Error(`loadTimeData: Key '${key}' not found`);
        }
        return this.data.get(key);
    }
    getString(key) {
        return String(this.getValue(key));
    }
    getBoolean(key) {
        return Boolean(this.getValue(key));
    }
    getInteger(key) {
        return Number(this.getValue(key));
    }
    set(key, value) {
        this.data.set(key, value);
    }
    // Allow setting multiple values at once
    setValues(values) {
        Object.entries(values).forEach(([key, value]) => {
            this.data.set(key, value);
        });
    }
}
export const loadTimeData = new LoadTimeData();
// Make it globally available if needed
if (typeof window !== 'undefined') {
    window.loadTimeData = loadTimeData;
}
//# sourceMappingURL=load_time_data.js.map