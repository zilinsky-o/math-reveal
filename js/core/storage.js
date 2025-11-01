/**
 * core/storage.js
 *
 * LocalStorage management for persistent data
 * - Collection save/load
 * - Highest level tracking
 *
 * Dependencies: data/collectibles.js, ui/ui-controller.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Gets the highest level achieved by the player
     */
    Game.getHighestLevel = function() {
        try {
            const saved = localStorage.getItem('mathGameHighestLevel');
            return saved ? parseInt(saved) : 1;
        } catch (e) {
            return 1;
        }
    };

    /**
     * Saves the highest level achieved (only if higher than current)
     */
    Game.saveHighestLevel = function(level) {
        try {
            const current = Game.getHighestLevel();
            if (level > current) {
                localStorage.setItem('mathGameHighestLevel', level.toString());
            }
        } catch (e) {
            console.error('Error saving highest level:', e);
        }
    };

    /**
     * Saves the collection to localStorage
     */
    Game.saveCollection = function(collection) {
        try {
            localStorage.setItem('mathGameCollection', JSON.stringify(collection));
        } catch (e) {
            console.error('Error saving collection:', e);
        }
    };

    /**
     * Loads the collection from localStorage
     */
    Game.loadCollection = function() {
        try {
            const saved = localStorage.getItem('mathGameCollection');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading collection:', e);
        }
        return [];
    };

    /**
     * Adds a collectible to the player's collection
     */
    Game.addToCollection = function(emoji, name) {
        const collection = Game.loadCollection();
        const existing = collection.find(item => item.emoji === emoji);

        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastFound = new Date().toISOString();
        } else {
            const animal = Game.COLLECTIBLES.find(bg => bg.emoji === emoji);
            const rarity = animal ? animal.baseRarity : 'common';

            const newItem = {
                emoji,
                name,
                rarity,
                count: 1,
                firstFound: new Date().toISOString(),
                lastFound: new Date().toISOString()
            };
            collection.push(newItem);
        }

        Game.saveCollection(collection);
        Game.updateCollectionCount();
    };

    /**
     * Removes a collectible from the collection (test mode only)
     */
    Game.removeFromCollection = function(emoji) {
        if (!Game.testMode) return;
        const collection = Game.loadCollection();
        const item = collection.find(c => c.emoji === emoji);

        if (item) {
            if ((item.count || 1) > 1) {
                item.count--;
            } else {
                const index = collection.indexOf(item);
                collection.splice(index, 1);
            }
            Game.saveCollection(collection);
            Game.updateCollectionCount();
            Game.viewCollection();
        }
    };

})();
