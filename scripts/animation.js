import wahVis from '../scripts/wahVisualization/wahVis.js';

// Now you can use the wahVis class in this file
const canvasId = 'animationCanvas';
const compressedContentId = 'compressedContent';
const states = [
    {
        runs: 0,
        runType: '0',
        startIndex: 0,
        compressed: '00101001',
        step: 1
    },
    {
        runs: 3,
        runType: '0',
        startIndex: 7,
        compressed: '10000011',
        step: 2
    },
    {
        runs: 4,
        runType: '1',
        startIndex: 28,
        compressed: '11000100',
        step: 3
    },
    {
        runs: 0,
        runType: '0',
        startIndex: 56,
        compressed: '01110101',
        step: 4
    }
];

const litSize = 7;
const uncompressed = '010100100000000000000000000011111111111111111111111111111110101';

const wahVisualizer = new wahVis(canvasId, compressedContentId, states, litSize, uncompressed);

// Add event listeners for buttons
document.getElementById('next-step').addEventListener('click', function() {
    wahVisualizer.transitionNext();
});
document.getElementById('micro-step').addEventListener('click', function() {
    wahVisualizer.transitionMicro();
});
document.getElementById('back-step').addEventListener('click', function() {
    wahVisualizer.stepBack();
});
document.getElementById('reset-btn').addEventListener('click', function() {
    wahVisualizer.reset();
});