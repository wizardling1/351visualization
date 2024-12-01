import wahVis from '../scripts/wahVisualization/wahVis.js';
import bbcVis from './bbcVisualization/bbcVis.js';
import { wahCompress } from '../scripts/compression/wah.js';
import { valCompress, getValSegmentLength } from './compression/val.js';
import { bbcCompress } from './compression/bbc.js';
import { AnimSettingsManager } from './AnimSettingsManager.js'

function compress(inputBitstring, settings, getStates) {
    switch (settings.compressionMethod) {
        case 'wah':
            if (getStates)
                return wahCompress(inputBitstring, settings.wordSize, true);
            else
                return wahCompress(inputBitstring, settings.wordSize).str;
        case 'val':
            if (getStates)
                return valCompress(inputBitstring, settings.wordSize, settings.numSegments, true);
            else
                return valCompress(inputBitstring, settings.wordSize, settings.numSegments).str;
        case 'bbc':
            if (getStates)
                return bbcCompress(inputBitstring, true);
            else
                return bbcCompress(inputBitstring);
    }
}

const compressedContent = document.getElementById('compressedContent');

// Function to scroll to the end of the compressed content
function scrollToEnd() {
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

class AnimationControls {
    constructor() {
        // define buttons to control animations and their actions
        this.nextStepButton = document.getElementById('next-step');
        this.microStepButton = document.getElementById('micro-step');
        this.backStepButton = document.getElementById('back-step');
        this.resetButton = document.getElementById('reset-btn');

        this.nextStepFunction = null;
        this.microStepFunction = null;
        this.backStepFunction = null;
        this.resetFunction = null;
    }

    
    setClickAction(visualizer) {
        // remove old event listeners for buttons
        if (this.nextStepFunction) this.nextStepButton.removeEventListener('click', this.nextStepFunction);
        if (this.microStepFunction) this.microStepButton.removeEventListener('click', this.microStepFunction);
        if (this.backStepFunction) this.backStepButton.removeEventListener('click', this.backStepFunction);
        if (this.resetFunction) this.resetButton.removeEventListener('click', this.resetFunction);

        this.nextStepFunction = function() {
            visualizer.transitionNext();
            setTimeout(scrollToEnd, 600); // Increased delay
        }
        this.microStepFunction = function() {
            visualizer.transitionMicro();
            setTimeout(scrollToEnd, 500); // Increased delay
        }
        this.backStepFunction = function() {
            visualizer.stepBack();
        }
        this.resetFunction = function() {
            visualizer.reset();
        }

        // Add event listeners for buttons
        this.nextStepButton.addEventListener('click', this.nextStepFunction);
        this.microStepButton.addEventListener('click', this.microStepFunction);
        this.backStepButton.addEventListener('click', this.backStepFunction);
        this.resetButton.addEventListener('click', this.resetFunction);
    }
}

const animationControls = new AnimationControls();

function initAnimation(inputBitstring, settings) {
    // If the input is empty, tell the user to add more input
    if (inputBitstring.length == 0) {
        document.getElementById('animationContainer').classList.add('d-none');
        document.getElementById('animationInstructionContainer').classList.remove('d-none');
        return;
    }
    document.getElementById('animationContainer').classList.remove('d-none');
    document.getElementById('animationInstructionContainer').classList.add('d-none');

    // Now you can use the wahVis class in this file
    let states = compress(inputBitstring, settings, true);
    const canvasId = 'animationCanvas';
    const compressedContentId = 'compressedContent';
    const stepDescriptionId = 'stepDescription';

    const wordSize = settings.wordSize;
    let litSize = wordSize - 1;
    let numSegments = 1;

    if (settings.compressionMethod === 'val') {
        litSize = getValSegmentLength(wordSize, settings.numSegments);
        numSegments = settings.numSegments;
    }

    // old test const uncompressed = '010100100000000000000000000011111111111111111111111111111110101';
    let visualizer;
    if (settings.compressionMethod === "bbc"){
        visualizer = new bbcVis(canvasId, compressedContentId, stepDescriptionId, inputBitstring);
    }
    else{
        visualizer = new wahVis(canvasId, compressedContentId, stepDescriptionId, states, wordSize, litSize, numSegments, inputBitstring);
    }

    animationControls.setClickAction(visualizer);
}

const inputField = document.getElementById('input-data');
const outputField = document.getElementById('compressed-output');

function initTextFields() {
    // Load saved input data from localStorage
    const savedInputData = localStorage.getItem('inputBitstring');
    if (savedInputData !== null) {
        inputField.value = savedInputData
    }
    else {
        inputField.value = "";
    }

    // Initial update of the output field
    inputField.value = inputField.value.match(/.{1,8}/g)?.join(' ') || inputField.value;

    inputField.addEventListener('input', event => {
        // ensure only 1 and 0 are entered
        event.target.value = event.target.value.replace(/[^01]/g, '');

        // Save input data to localStorage
        localStorage.setItem('inputBitstring', event.target.value);
        updateOutputField();

        // Format the inputfield to have spaces between bytes
        inputField.value = inputField.value.match(/.{1,8}/g)?.join(' ') || inputField.value;
    });
    updateOutputField();
}

function updateOutputField() {
    let inputBitstring = inputField.value;
    if (inputBitstring) {
        inputBitstring = inputField.value.replace(/[^01]/g, '');
    }

    let output = compress(inputBitstring, animSettings.getSettings(), false);
    const compressionMethod = animSettings.getSettings().compressionMethod;
    if (compressionMethod == 'bbc') {
        output = output.match(/.{1,8}/g)?.join(' ') || output; // Regex optional
    }
    outputField.value = output;

    initAnimation(inputBitstring, animSettings.getSettings());
}

let animSettings = new AnimSettingsManager(updateOutputField);
initTextFields();
document.getElementById('dark-mode-toggle').addEventListener('click', function() {updateOutputField();});
