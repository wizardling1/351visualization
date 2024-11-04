import wahVis from '../scripts/wahVisualization/wahVis.js';
import bbcVis from '../scripts/bbcVisualization/bbcVis.js';
import { wahCompressWithStates } from '../scripts/compression/animation_states/wahWithStates.js';
import { bbcCompress } from './compression/raw_compression/bbc.js';

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

    //const states = wahCompressWithStates(savedInputData, 8);
    //console.log(states)

    const canvasId = 'animationCanvas';
    const compressedContentId = 'compressedContent';

    const litSize = 7;

   // old test const uncompressed = '010100100000000000000000000011111111111111111111111111111110101';

    // const wahVisualizer = new wahVis(canvasId, compressedContentId, states, litSize, savedInputData);
    const bbcVisualizer = new bbcVis('animationCanvas', 'compressedContent', savedInputData || "000000000000000000010000");

    // Add event listeners for buttons
    document.getElementById('next-step').addEventListener('click', function() {
        bbcVisualizer.transitionNext();
    });
    document.getElementById('micro-step').addEventListener('click', function() {
        bbcVisualizer.transitionMicro();
    });
    document.getElementById('back-step').addEventListener('click', function() {
        bbcVisualizer.stepBack();
    });
    document.getElementById('reset-btn').addEventListener('click', function() {
        bbcVisualizer.reset();
    });
}