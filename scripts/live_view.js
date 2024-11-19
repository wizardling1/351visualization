import { wahCompress, valCompress, bbcCompress } from './compression/raw_compression/compressions.js';
import { getStoredCompressionSettings } from './storage.js';

const wordSizeSegments = {
    '8': ['1', '2'],
    '16': ['1', '2', '4'],
    '32': ['1', '2', '4', '8'],
    '64': ['1', '2', '4', '8', '16'],
};

class CompressionSettingsManager {
    constructor(updateFunction) {
        // Load settings from localStorage if available
        this.compressionSettings = getStoredCompressionSettings();

        this.rows = document.querySelectorAll(".selection-row");
        this.wordSizeRow = document.querySelector("#wordSizeSelector");
        this.numSegmentRow = document.querySelector("#segmentCountSelector");
        this.wahButton = document.querySelector("#wahButton");
        this.valButton = document.querySelector("#valButton");
        this.bbcButton = document.querySelector("#bbcButton");
        if (typeof(updateFunction) == 'function') 
            this.updateFunction = updateFunction;
        else
            this.updateFunction = () => 1;
    }

    init() {
        this.initButtonHighlighting();
        this.initCompressionRow();	
        this.initWordSizeRow();
        this.initNumSegmentRow();
        this.restoreSelections(); // Restore button selections
    }

    initButtonHighlighting() {
        this.rows.forEach(row => {
            row.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    this.clearRowSelections(row);
                    button.classList.add('active');
                });
            })
        });
    }

    initCompressionRow() {
        const toggleWordSizeButtons = document.querySelectorAll('#wordSize16Button, #wordSize32Button, ' 
                                                                + '#wordSize64Button');
        const segmentButtons = this.numSegmentRow.querySelectorAll('.btn');

        const compressionButtonClickAction = (type) => {
            toggleWordSizeButtons.forEach(button => {
                button.style.display = (type == 'bbc') ? 'none' : 'flex';
            });
            if (type == 'val') {
                segmentButtons.forEach(button => {
                    button.style.display = 'none';
                });
                const wordSize = this.compressionSettings.wordSize.toString();
                if (wordSizeSegments[wordSize]) {
                    wordSizeSegments[wordSize].forEach(segmentCount => {
                        const btn = [...segmentButtons].find(b => b.textContent == segmentCount);
                        if (btn) {
                            btn.style.display = 'flex';
                        }
                    });
                }
                // Set numSegments to 2 and select the button
                this.compressionSettings.numSegments = 2;
                this.selectButton(this.numSegmentRow, this.compressionSettings.numSegments);
            } else {
                segmentButtons.forEach(button => {
                    button.style.display = 'none';
                });
            }
            this.compressionSettings.compressionMethod = type;
            // Remove 'active' class from all compression buttons
            this.wahButton.classList.remove('active');
            this.valButton.classList.remove('active');
            this.bbcButton.classList.remove('active');
            // Add 'active' class to the clicked button
            const clickedButton = document.querySelector(`#${type}Button`);
            if (clickedButton) {
                clickedButton.classList.add('active');
            }
            this.saveSettings(); // Save to localStorage
            this.updateFunction();
        }

        this.wahButton.addEventListener("click", () => {
            compressionButtonClickAction('wah');
        });
        this.valButton.addEventListener("click", () => {
            compressionButtonClickAction('val');
        });
        this.bbcButton.addEventListener("click", () => {
            compressionButtonClickAction('bbc');
        });
    }

    initWordSizeRow() {
        const wordSizeButtonClickAction = (wsBtn) => {
            const wordSize = wsBtn.textContent;
            this.compressionSettings.wordSize = parseInt(wordSize);
            if (this.compressionSettings.compressionMethod == 'val') {
                this.numSegmentRow.querySelectorAll('.btn').forEach(button => {
                    button.classList.remove('active');
                    button.style.display = 'none';
                });
                wordSizeSegments[wordSize].forEach(segmentCount => {
                    const btn = [...this.numSegmentRow.querySelectorAll('.btn')]
                        .find(b => b.textContent == segmentCount);
                    if (btn) {
                        btn.style.display = 'flex';
                    }
                });
                // Set numSegments to 2 and select the button
                this.compressionSettings.numSegments = 2;
                this.selectButton(this.numSegmentRow, this.compressionSettings.numSegments);
            }
            this.saveSettings(); // Save to localStorage
            this.updateFunction();
        }

        this.wordSizeRow.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => wordSizeButtonClickAction(btn));
        });
    }

    initNumSegmentRow() {
        this.numSegmentRow.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.compressionSettings.numSegments = parseInt(btn.textContent);
                this.saveSettings(); // Save to localStorage
                this.updateFunction();
            });
        });
    }

    clearRowSelections(row) {
        row.querySelectorAll('button').forEach(button => button.classList.remove('active'));
    }

    selectButton(row, buttonValue) {
        row.querySelectorAll('button').forEach(button => button.classList.remove('active'));
        const button = [...row.querySelectorAll('button')].find(b => b.textContent == buttonValue);
        if (button) {
            button.classList.add('active');
        }
    }

    saveSettings() {
        localStorage.setItem('compressionSettings', JSON.stringify(this.compressionSettings));
    }

    restoreSelections() {
        // Remove 'active' class from all compression buttons
        this.wahButton.classList.remove('active');
        this.valButton.classList.remove('active');
        this.bbcButton.classList.remove('active');

        // Restore compression method selection
        const compressionMethod = this.compressionSettings.compressionMethod;
        const compressionButton = document.querySelector(`#${compressionMethod}Button`);
        if (compressionButton) {
            compressionButton.classList.add('active');
        }

        // Adjust word size and segment buttons visibility based on compression method
        const toggleWordSizeButtons = document.querySelectorAll('#wordSize16Button, #wordSize32Button, #wordSize64Button');
        const segmentButtons = this.numSegmentRow.querySelectorAll('.btn');

        if (compressionMethod === 'bbc') {
            toggleWordSizeButtons.forEach(button => {
                button.style.display = 'none';
            });
            segmentButtons.forEach(button => {
                button.style.display = 'none';
            });
        } else if (compressionMethod === 'val') {
            toggleWordSizeButtons.forEach(button => {
                button.style.display = 'flex';
            });
            segmentButtons.forEach(button => {
                button.style.display = 'none';
            });
            const wordSize = this.compressionSettings.wordSize.toString();
            if (wordSizeSegments[wordSize]) {
                wordSizeSegments[wordSize].forEach(segmentCount => {
                    const btn = [...segmentButtons].find(b => b.textContent == segmentCount);
                    if (btn) {
                        btn.style.display = 'flex';
                    }
                });
            }
            // Ensure numSegments is active
            this.selectButton(this.numSegmentRow, this.compressionSettings.numSegments);
        } else if (compressionMethod === 'wah') {
            toggleWordSizeButtons.forEach(button => {
                button.style.display = 'flex';
            });
            segmentButtons.forEach(button => {
                button.style.display = 'none';
            });
        }

        // Restore word size selection
        this.clearRowSelections(this.wordSizeRow);
        this.selectButton(this.wordSizeRow, this.compressionSettings.wordSize);

        // Restore number of segments selection
        this.clearRowSelections(this.numSegmentRow);
        this.selectButton(this.numSegmentRow, this.compressionSettings.numSegments);

        // Update the UI to reflect the restored settings
        this.updateFunction();
    }
}

let compressionSettingsManager = new CompressionSettingsManager();

const inputField = document.getElementById('input-data');
const outputField = document.getElementById('compressed-output');

// Load saved input data from localStorage
const savedInputData = localStorage.getItem('inputData');
if (savedInputData !== null) {
    inputField.value = savedInputData
}

const updateOutputField = () => {
    let toCompress = inputField.value;
    if (inputField.value) {
        toCompress = inputField.value.replace(/[^01]/g, '');
    }
    const compressionMethod = compressionSettingsManager.compressionSettings.compressionMethod;
    const wordSize = compressionSettingsManager.compressionSettings.wordSize;
    const numSegments = compressionSettingsManager.compressionSettings.numSegments;

    if (compressionMethod == 'wah') {
        outputField.value = wahCompress(toCompress, wordSize).str;
    }
    else if (compressionMethod == 'val') {
        outputField.value = valCompress(toCompress, wordSize, numSegments).str;
    }
    else if (compressionMethod == 'bbc') {
        // unpack output and states from bbc compression
        console.log(toCompress);
        let output = bbcCompress(toCompress);
        outputField.value = output.match(/.{1,8}/g)?.join(' ') || output; // Regex optional
    }
}

// Initialize the compression settings manager with the update function
compressionSettingsManager.updateFunction = updateOutputField;
compressionSettingsManager.init();

// Initial update of the output field
updateOutputField();
inputField.value = inputField.value.match(/.{1,8}/g)?.join(' ') || inputField.value;

inputField.addEventListener('input', event => { 
    // ensure only 1 and 0 are entered
    event.target.value = event.target.value.replace(/[^01]/g, '');

    // Save input data to localStorage
    localStorage.setItem('inputData', event.target.value);
    updateOutputField();

    // Format the inputfield to have spaces between bytes
    inputField.value = inputField.value.match(/.{1,8}/g)?.join(' ') || inputField.value;
});

const updateAnimations = () =>{
    compressionSettingsManager.saveSettings();
    //have to dispatch custom event because listener on local storage only works with separate tabs
    const updateEvent = new CustomEvent('compressionSettingsUpdated');
    window.dispatchEvent(updateEvent);
}

inputField.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        updateAnimations()
    }
});

document.getElementById('animateButton').addEventListener('click', event => {
    updateAnimations()
})
