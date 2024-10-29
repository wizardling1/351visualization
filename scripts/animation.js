import wahVis from '../scripts/wahVisualization/wahVis.js';
import { wahCompressWithStates } from '../scripts/compression/animation_states/wahWithStates.js';

// get settings and input from local
const savedSettings = JSON.parse(localStorage.getItem('compressionSettings'));
const savedInputData = localStorage.getItem('inputData');


// Check if the settings and input data are valid
if (!savedSettings || savedSettings.compressionMethod !== 'wah' || savedSettings.wordSize !== 8) {
    document.getElementById('VisTitle').innerHTML = 'Oops, currently only WAH 8 visualization is supported';
} else if (!savedInputData || savedInputData.length < 8) {
    document.getElementById('VisTitle').innerHTML = 'Please go to live view and input your uncompressed bits';
} else {
    // Now you can use the wahVis class in this file

    const states = wahCompressWithStates(savedInputData, 8);


    const canvasId = 'animationCanvas';
    const compressedContentId = 'compressedContent';

    const litSize = 7;

   // old test const uncompressed = '010100100000000000000000000011111111111111111111111111111110101';

    const wahVisualizer = new wahVis(canvasId, compressedContentId, states, litSize, savedInputData);

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
}