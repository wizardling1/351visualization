
const compressionSettings = {
    compressionMethod: 'wah',
    wordSize: 8,
    numSegments: 2
};

const wordSizeSegments = {
    '8': ['1', '2', '4'],
    '16': ['1', '2', '4', '8'],
    '32': ['1', '2', '4', '8', '16'],
    '64': ['1', '2', '4', '8', '16', '32'],
};

class CompressionSettingsManager {
    constructor(updateFunction) {
        this.compressionSettings = compressionSettings;
        this.rows = document.querySelectorAll(".selection-row");
        this.compressionRow = document.querySelector("#compressionSelector");
        this.wordSizeRow = document.querySelector("#wordSizeSelector");
        this.numSegmentRow = document.querySelector("#segmentSizeSelector");
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
    }

    initButtonHighlighting() {
		this.rows.forEach(row => {
		    row.querySelectorAll('button').forEach(button => {
		        button.addEventListener('click', () => {
		            this.clearRowSelections(row);
		            button.classList.add('selected');
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
                    if (parseInt(button.textContent) <= 4) 
                        button.style.display = 'flex'
                    else 
                        button.style.display = 'none'
                });
            }
            else {
                segmentButtons.forEach(button => {
                    button.style.display = 'none';
                });
            }
            this.selectButton(this.wordSizeRow, 8);
            Object.assign(this.compressionSettings, { compressionMethod: type, wordSize: 8, numSegments: 2 });
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
            if (this.compressionSettings.compressionMethod == 'val') {
                this.numSegmentRow.querySelectorAll('.btn').forEach(button => {
                    button.classList.remove('selected');
                    button.style.display = 'none';
                });
                wordSizeSegments[wsBtn.textContent].forEach(segmentSize => {
                    [...this.numSegmentRow.querySelectorAll('.btn')]
                        .filter(b => b.textContent == segmentSize)[0]
                        .style.display = 'flex';
                });
                document.querySelector('#segmentSize2Button').classList.add('selected');
                this.compressionSettings.numSegments = 2;
            }
            this.compressionSettings.wordSize = parseInt(wsBtn.textContent);
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
		        this.updateFunction();
		    });
		});
    }

    clearRowSelections(row) {
		row.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    }

    selectButton(row, buttonValue) {
		row.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
		[...row.querySelectorAll('button')].filter(b => b.textContent == buttonValue)[0].classList.add('selected');
    }
}

import { wahCompress, valCompress, bbcCompress } from './compression/raw_compression/compressions.js';
let compressionSettingsManager = new CompressionSettingsManager();

const inputField = document.getElementById('input-data');
const outputField = document.getElementById('compressed-output');

const updateOutputField = () => {
    const compressionMethod = compressionSettingsManager.compressionSettings.compressionMethod;
    const wordSize = compressionSettingsManager.compressionSettings.wordSize;
    const numSegments = compressionSettingsManager.compressionSettings.numSegments;

    if (compressionMethod == 'wah') {
        outputField.value = wahCompress(inputField.value, wordSize).str;
    }
    else if (compressionMethod == 'val') {
        outputField.value = valCompress(inputField.value, wordSize, numSegments).str;
    }
    else if (compressionMethod == 'bbc') {
        outputField.value = bbcCompress(inputField.value);
    }
}

compressionSettingsManager.updateFunction = updateOutputField;
compressionSettingsManager.init();

inputField.addEventListener('input', event => {
    // ensure only 1 and 0 are entered
    event.target.value = event.target.value.replace(/[^01]/g, '');
    updateOutputField();
});
