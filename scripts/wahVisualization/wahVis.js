import { simplifyString, decimalToBinary, drawArrow } from './helperFunctions.js';

class wahVis {
    constructor(canvasId, compressedContentId, states, litSize, uncompressed) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.compressedContentElement = document.getElementById(compressedContentId);
        this.states = states;
        this.litSize = litSize;

        this.currentStateIndex = 0;
        this.currRunShown = states[this.currentStateIndex].runs;

        this.uncompressed = uncompressed;

        // Canvas setup
        const canvasWidth = 600;
        const canvasHeight = 300;
        const dpr = 1.5;
        this.canvas.width = canvasWidth * dpr;
        this.canvas.height = canvasHeight * dpr;
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        this.ctx.scale(dpr, dpr);

        // Initial draw
        this.drawCanvas(this.states[this.currentStateIndex]);
        this.updateCompressedSoFar();
    }

    drawCanvas(state, transition = 0, curr_run = state.runs) {
        const ctx = this.ctx;
        const canvasWidth = 600;
        const canvasHeight = 300;
    
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
        // Uncompressed display
        ctx.font = `30px monospace`;
        ctx.fillStyle = 'black';
    
        
    
        const uncompressedDigitWidth = ctx.measureText("0").width;
        const start_point = - (transition * this.litSize * uncompressedDigitWidth);

        // Calculate the number of digits that can fit in the canvas width
        const canFit = Math.ceil(canvasWidth / uncompressedDigitWidth);
        let current_uncompressed;
    
        
        
        // get the highlight in the middle
        const highlightStartDigit = Math.floor(Math.floor(canvasWidth/uncompressedDigitWidth)/2) - Math.floor(this.litSize / 2)
        let highlightWidth = this.litSize * uncompressedDigitWidth;
        let highlightStart = highlightStartDigit  * uncompressedDigitWidth;
        let uncompressedStartIndex = state.startIndex;
        uncompressedStartIndex += curr_run === 0 ? 0 : (curr_run - 1) * this.litSize;
        // first if we dont have enough digits before start then fill with spaces
        if (state.runs > 1 && curr_run == state.runs) {    // here we simplify the runs displayed
    
            // the simplifyString function turns a bunch of runs into 11..11
            let simplifiedString = simplifyString(state.runType, this.litSize);
            const new_start = state.startIndex + this.litSize * state.runs;
            current_uncompressed = simplifiedString + this.uncompressed.substring(new_start, new_start + canFit);
        } else {
            
            current_uncompressed = this.uncompressed.substring(uncompressedStartIndex, uncompressedStartIndex + canFit + this.litSize);
        }

        // get the functional start index
        const startIndex = (state.runs > 1 && curr_run == state.runs) ? state.startIndex : uncompressedStartIndex;

        // generate fill string to fill up space upto highlight
        
        let fillString;
        // we dont have enough in uncompressed before
        if (startIndex < highlightStartDigit){
            const spaces_needed = highlightStartDigit - startIndex;
            fillString = " ".repeat(spaces_needed) + this.uncompressed.substring(0, startIndex)
        } else { // fill with chars before the start index
            fillString = this.uncompressed.substring(startIndex - highlightStartDigit, startIndex)
        }

        current_uncompressed = fillString + current_uncompressed



        ctx.fillText(current_uncompressed, start_point, 60);
    
        // Highlight around current step
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(highlightStart, 30, highlightWidth, 40);
    

        // Subtext
        ctx.font = `22px Arial`;
        ctx.fillStyle = 'black';
        let top_text = state.runs === 0 ? 'Literal' : `${curr_run} runs of ${state.runType}'s`;
        ctx.fillText(top_text, 20, 100);
    
        // Compressed Display

        // consts for positioning stuff

        // Get font size for the compresssed text
        let compressedFontSize;
        let compresedH;
        switch (this.litSize) {
            case 7:
            compressedFontSize = 90;
            compresedH = 200;
            break;
            case 15:
            compressedFontSize = 60;
            compresedH = 190;
            break;
            case 31:
            compressedFontSize = 30;
            compresedH = 180;
            break;
            default:
            compressedFontSize = 20; // Default value if litSize is not 7, 15, or 31
        }

           //vertical position of main compressed text
        const gap = 3;                      //gap between underlines of difference sections
        const runsTextSize = 25;

        const underlineH = compresedH + 10
        const textH = 270

        

        const runColor = "red";
        const runTypeColor = "blue";
        const litColor = "black"
        

        //generate the compressed bit for micro steps
        let compressed = state.runs === 0 ? state.compressed : `1${state.runType}${decimalToBinary(curr_run, this.litSize - 1)}`;
        
    
        //main compressed bit area
        ctx.font = `bold ${compressedFontSize}px monospace`;
        ctx.fillStyle = 'black';
        ctx.fillText(compressed, 0, compresedH);
    
        // these calculations need to happen after the font size is set.
        const compressedWidth = ctx.measureText(compressed).width;
        const bitWidth = compressedWidth / compressed.length;
        
        

        if (state.runs > 0) {
            // Underline first bit
            ctx.strokeStyle = runColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(gap, underlineH);
            ctx.lineTo(bitWidth - gap, underlineH);
            ctx.stroke();
            ctx.font = `bold ${runsTextSize}px Arial`;
            ctx.fillStyle = runColor;
            
            const firstBitText = "run";
            ctx.fillText(firstBitText, gap, textH);

            //  draw arrow
            const middleFirstText = ctx.measureText(firstBitText).width / 2;
            

            drawArrow(ctx, gap + middleFirstText, textH-15, bitWidth/2, underlineH+5, 10);
    
            // Underline second bit
            ctx.strokeStyle = runTypeColor;
            ctx.fillStyle = runTypeColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth + gap, underlineH);
            ctx.lineTo(2 * bitWidth - gap, underlineH);
            ctx.stroke();

            const secondBitText = `of ${state.runType}'s`;

            ctx.fillText(secondBitText, 60, textH);

            const middleSecondText = ctx.measureText(secondBitText).width / 2;

            drawArrow(ctx, 60 + middleSecondText, textH - 20, bitWidth +bitWidth/2 - gap, underlineH+5, 10);

    
            // Underline rest of the string
            ctx.strokeStyle = litColor;
            ctx.fillStyle = litColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth * 2 + gap, underlineH);
            ctx.lineTo(compressedWidth - gap, underlineH);
            ctx.stroke();

            const restText = `${curr_run} ${curr_run > 1 ? 'times' : 'time'}`;
            ctx.fillText(restText, 260, textH);

            const middleRestText = ctx.measureText(restText).width / 2;
            drawArrow(ctx, 260 + middleRestText, textH-20, compressedWidth/2, underlineH+5, 10);
    
        } else {
            // Literal
            ctx.strokeStyle = litColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth + gap, underlineH);
            ctx.lineTo(compressedWidth - gap, underlineH);
            ctx.stroke();
            ctx.font = `bold ${runsTextSize}px Arial`;
            ctx.fillStyle = litColor;
            ctx.fillText(`literal`, 150, underlineH + 30);
        }
    
        // Add small text in the bottom right that says current word we are on
        ctx.font = `bold 15px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(`word : ${this.currentStateIndex + 1}`, canvasWidth - 100, canvasHeight - 10);
    }
    

    updateCompressedSoFar(lastElement = false) {
        // Initialize compressedSoFar if not already done
        if (this.compressedSoFar === undefined) {
            this.compressedSoFar = "";
            this.prevStateIndex = 0;
        }
    
        // Determine the number of states to consider
        const numOfStates = lastElement ? this.currentStateIndex + 1 : this.currentStateIndex;
    
        if (numOfStates > this.prevStateIndex) {
            // Moving forward, append new compressed code
            for (let i = this.prevStateIndex; i < numOfStates; i++) {
                this.compressedSoFar += this.states[i].compressed;
            }
        } else if (numOfStates < this.prevStateIndex) {
            // Moving backward, remove compressed code
            for (let i = numOfStates; i < this.prevStateIndex; i++) {
                const lengthToRemove = this.states[i].compressed.length;
                this.compressedSoFar = this.compressedSoFar.slice(0, -lengthToRemove);
            }
        }
    
        // Update previous state index
        this.prevStateIndex = numOfStates;
    
        // Update the compressed content display
        this.compressedContentElement.innerText = this.compressedSoFar;
    }

    // transition to the next compressed word or to the end of current one
    transitionNext() {
        
        const fromState = this.states[this.currentStateIndex];
        const fromRun = this.currRunShown;

        if (this.currentStateIndex >= this.states.length - 1) {
            this.updateCompressedSoFar(true);
            return;
        }

        if (this.currRunShown != fromState.runs) {
            this.currRunShown = fromState.runs;
        } else if (this.currentStateIndex < this.states.length - 1) {
            this.currentStateIndex++;
            this.currRunShown = this.states[this.currentStateIndex].runs;
        }

        requestAnimationFrame(this.animate(fromState, fromRun, performance.now()).bind(this));
    }

    // transition to the next micro step eg.. one more run of current word
    transitionMicro() {
        const fromState = this.states[this.currentStateIndex];
        const fromRun = this.currRunShown;

        // if we are at the last state already
        if (this.currentStateIndex >= this.states.length - 1 && this.currRunShown >= fromState.runs) {
            this.updateCompressedSoFar(true);
            return;
        }

        //if we are comming from a literal or end of run
        if (fromState.runs == 0 || this.currRunShown == fromState.runs) {
            this.currentStateIndex++;
            if (this.states[this.currentStateIndex].runs == 0){
                //current state is a literal
                this.currRunShown = 0;
            } else {
                //current state is a run
                this.currRunShown = 1;
            }
            
        } else { // otherwise just increment the run shown
            this.currRunShown++;
        }

        requestAnimationFrame(this.animate(fromState, fromRun, performance.now()).bind(this));
    }

    // if we are in the middle of a state, or at the end we step back to the beginning
    stepBack() {    
        const fromState = this.states[this.currentStateIndex];
        const fromRun = this.currRunShown;

        if ((this.currentStateIndex === 0 && fromState.runs === 0) || (this.currentStateIndex === 0 && fromRun === 1)) {
            return; // we are at the first step
        }

        // if the state was a literal or we were on the first run
        if (fromState.runs === 0 || fromRun === 1) {
            this.currentStateIndex--;
            this.currRunShown = this.states[this.currentStateIndex].runs;
        } else {
            this.currRunShown = 1;
        }

        this.drawCanvas(this.states[this.currentStateIndex], 0, this.currRunShown);
        this.updateCompressedSoFar();
    }

    // reset to the beginning
    reset() {
        
        this.currentStateIndex = 0;
        this.currRunShown = this.states[this.currentStateIndex].runs;
        // document.getElementById('nextButton').disabled = false;
        // document.getElementById('microButton').disabled = false;
        this.compressedContentElement.innerText = '';
        this.drawCanvas(this.states[this.currentStateIndex]);
        this.updateCompressedSoFar();
    }

    // animate between states.
    animate(fromState, fromRun, startTime) {
        return (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / 500, 1);

            this.drawCanvas(fromState, progress, fromRun);

            if (progress < 1) {
                requestAnimationFrame(this.animate(fromState, fromRun, startTime).bind(this));
            } else {
                this.drawCanvas(this.states[this.currentStateIndex], 0, this.currRunShown);
                this.updateCompressedSoFar();
            }
        };
    }
}

export default wahVis;