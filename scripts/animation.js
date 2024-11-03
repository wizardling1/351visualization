import wahVis from '../scripts/wahVisualization/wahVis.js';
import { wahCompressWithStates } from '../scripts/compression/animation_states/wahWithStates.js';

// get settings and input from local
const savedSettings = JSON.parse(localStorage.getItem('compressionSettings'));
const savedInputData = localStorage.getItem('inputData');



// Check if the settings and input data are valid
if (!savedSettings || savedSettings.compressionMethod !== 'wah' || savedSettings.wordSize == 64) {
    document.getElementById('VisTitle').innerHTML = 'Please Choose Wah with a word size of 8 - 32.';
} else if (!savedInputData || savedInputData.length < 8) {
    document.getElementById('VisTitle').innerHTML = 'Please go to live view and input your uncompressed bits';
} else {
    // Now you can use the wahVis class in this file

    const states = wahCompressWithStates(savedInputData, savedSettings.wordSize);
    //console.log(states)


    const canvasId = 'animationCanvas';
    const compressedContentId = 'compressedContent';

    const litSize = savedSettings.wordSize - 1;

   // old test const uncompressed = '010100100000000000000000000011111111111111111111111111111110101';

    const wahVisualizer = new wahVis(canvasId, compressedContentId, states, litSize, savedInputData);

    // Function to scroll to the end of the compressed content
    function scrollToEnd() {
        const compressedContent = document.getElementById('compressedContent');
        // Force a reflow to ensure content width is calculated correctly
        compressedContent.style.display = 'none';
        compressedContent.offsetHeight; // Force reflow
        compressedContent.style.display = 'block';
        
        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => {
            compressedContent.scrollTo({
                left: compressedContent.scrollWidth,
                behavior: 'smooth'
            });
        });
    }

    // Add event listeners for buttons
    document.getElementById('next-step').addEventListener('click', function() {
        wahVisualizer.transitionNext();
        setTimeout(scrollToEnd, 600); // Increased delay
    });
    document.getElementById('micro-step').addEventListener('click', function() {
        wahVisualizer.transitionMicro();
        setTimeout(scrollToEnd, 500); // Increased delay
    });
    document.getElementById('back-step').addEventListener('click', function() {
        wahVisualizer.stepBack();
        
    });
    document.getElementById('reset-btn').addEventListener('click', function() {
        wahVisualizer.reset();
        
    });
}