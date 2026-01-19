/**
 * Browser polyfills for Chrome-specific window properties
 */
// Initialize errorPageController mock
if (typeof window !== 'undefined') {
    window.errorPageController = {
        updateEasterEggHighScore: (score) => {
            // Store high score in localStorage
            localStorage.setItem('dinoHighScore', score.toString());
        },
        resetEasterEgg: () => {
            // Reset handled silently
        },
        trackEasterEgg: () => {
            // Tracking handled silently
        }
    };
    window.initializeEasterEggHighScore = (score) => {
        const savedScore = localStorage.getItem('dinoHighScore');
        if (savedScore) {
            return parseInt(savedScore, 10);
        }
        return score;
    };
}
export {};
//# sourceMappingURL=window_polyfills.js.map