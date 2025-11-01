/**
 * gameplay/picture-reveal.js
 *
 * Picture reveal mechanics for levels 1-4
 * - Grid creation
 * - Cell state updates
 * - Visual reveal effects
 *
 * Dependencies: core/game-state.js, ui/animations.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Creates the reveal grid
     */
    Game.createGrid = function() {
        const grid = document.getElementById('grid');
        if (!grid) return;

        grid.innerHTML = '';

        for (let rowIndex = 0; rowIndex < Game.GRID_SIZE; rowIndex++) {
            const row = rowIndex + Game.GRID_OFFSET;
            const rowDiv = document.createElement('div');
            rowDiv.className = 'grid-row';

            for (let colIndex = 0; colIndex < Game.GRID_SIZE; colIndex++) {
                const col = colIndex + Game.GRID_OFFSET;
                const cellKey = `${row}-${col}`;

                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';
                cellDiv.id = cellKey;

                const coverDiv = document.createElement('div');
                coverDiv.className = 'cell-cover';
                coverDiv.id = `${cellKey}-cover`;

                const cracksDiv = document.createElement('div');
                cracksDiv.className = 'cell-cracks';
                cracksDiv.id = `${cellKey}-cracks`;
                cracksDiv.innerHTML = Game.createCrackSVG();

                cellDiv.appendChild(coverDiv);
                cellDiv.appendChild(cracksDiv);
                rowDiv.appendChild(cellDiv);
            }

            grid.appendChild(rowDiv);
        }
    };

    /**
     * Updates a cell's visual state based on its progress
     */
    Game.updateCell = function(cellKey) {
        const cells = Game.getCells();
        const cell = cells[cellKey];
        const coverDiv = document.getElementById(`${cellKey}-cover`);
        const cracksDiv = document.getElementById(`${cellKey}-cracks`);

        if (coverDiv && cracksDiv) {
            if (cell.correctAnswers === 0) {
                coverDiv.style.opacity = '1';
                cracksDiv.style.opacity = '0';
            } else if (cell.correctAnswers === 1) {
                coverDiv.style.opacity = '0.7';
                cracksDiv.style.opacity = '1';
            } else {
                coverDiv.style.opacity = '0';
                cracksDiv.style.opacity = '0';
            }
        }
    };

})();
