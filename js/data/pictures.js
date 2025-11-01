/**
 * data/pictures.js
 *
 * Picture/background selection logic for revealed images
 * - Selects random backgrounds based on rarity
 *
 * Dependencies: data/collectibles.js, core/storage.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Selects a random background based on rarity system
     * Uses player's highest level to determine rarity probability
     */
    Game.selectRandomBackground = function() {
        const highestLevel = Game.getHighestLevel();
        const targetRarity = Game.determineRarity(highestLevel);

        const matchingRarity = Game.COLLECTIBLES.filter(bg => bg.baseRarity === targetRarity);

        if (matchingRarity.length > 0) {
            return matchingRarity[Math.floor(Math.random() * matchingRarity.length)];
        } else {
            return Game.COLLECTIBLES[Math.floor(Math.random() * Game.COLLECTIBLES.length)];
        }
    };

})();
