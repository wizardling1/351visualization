import { bbcCompress } from "../compression/raw_compression/bbc.js";


class bbcVis {
    constructor(canvasId, compressedContentId, uncompressed) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.compressedContentElement = document.getElementById(compressedContentId);

        this.uncompressed = uncompressed.match(/.{1,8}/g) || uncompressed;

        [this.compressed, this.states] = bbcCompress(uncompressed, true);
        console.log(this.states)

        this.litSize = 8;

        this.currentStateIndex = 0;
        this.currRunShown = 1;

        // Canvas setup
        const canvasWidth = 600;
        const canvasHeight = 300;
        const dpr = 1.5;
        this.canvas.width = canvasWidth * dpr;
        this.canvas.height = canvasHeight * dpr;
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        this.ctx.scale(dpr, dpr);

        let startState = this.states[0];
        // Initial draw
        this.drawCanvas(startState);
        this.updateCompressedSoFar();
    }

    drawCanvas(state, transition = 0, curr_run = 1) {
        const ctx = this.ctx;
        const canvasWidth = 600;
        const canvasHeight = 300;
    
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
        // Uncompressed display
        ctx.font = `30px monospace`;
        ctx.fillStyle = 'black';
    
        const uncompressedDigitWidth = ctx.measureText("0").width;
        const start_point = 5 - (transition * 9 * uncompressedDigitWidth);
        // Calculate the number of digits that can fit in the canvas width
        let current_uncompressed;
    
        if (state.runs > 1 && curr_run == state.runs) {    // here we simplify the runs displayed
            // the simplifyString function turns a bunch of runs into 11..11
            let simplifiedString = "00....00";
            current_uncompressed = simplifiedString + " " + this.uncompressed.slice(state.startChunk + curr_run).join(" ");
        } else {
            current_uncompressed = this.uncompressed.slice(state.startChunk + curr_run - 1).join(" ");
        }
    
        let highlightWidth = this.litSize * uncompressedDigitWidth;
        ctx.fillText(current_uncompressed, start_point, 60);
    
        // Highlight around current step
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(5, 30, highlightWidth, 40);
    
        // Subtext
        ctx.font = `22px Arial`;
        ctx.fillStyle = 'black';
        let top_text = `${curr_run} runs of 0's`;

        if (curr_run > state.runs) {
            if (state.special){
                let word = this.uncompressed[state.startChunk + curr_run - 1];
                top_text = `Dirty Bit Location: ${word.indexOf(1)}`;
            }
        }
        ctx.fillText(top_text, 20, 100);
    
        // Compressed
        let compressed = state.encodedChunk;
        
        // Counting runs, so only display the run count
        if(curr_run <= state.runs) {
            compressed = Math.min(curr_run, 7).toString(2).padStart(3, '0') + "00000";
        }
    
        ctx.font = `bold 110px monospace`;
        ctx.fillStyle = 'black';
        ctx.fillText(compressed, 0, 230);
    
        const compressedWidth = ctx.measureText("00000000").width;
        const bitWidth = compressedWidth / 8;
        const gap = 5;
        
        // Header bit
        // Underline first bit
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gap, 240);
        ctx.lineTo(3 * bitWidth - gap, 240);
        ctx.stroke();
        ctx.font = `20px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(`${curr_run <= 6 ? Math.min(curr_run, state.runs) : '6+'} runs of 0`, bitWidth + gap, 270);

        if (this.currRunShown >= state.runs + 1) {
            // Underline second bit
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(3 * bitWidth + gap, 240);
            ctx.lineTo(4 * bitWidth - gap, 240);
            ctx.stroke();
            ctx.fillText(`spec?`, gap + bitWidth * 3, 270);
            
            // Underline rest of the string
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth * 4 + gap, 240);
            ctx.lineTo(compressedWidth - gap, 240);
            ctx.stroke();
            ctx.fillText(`DB location/ # of literals`, 4 * bitWidth + gap * 2, 270);
    
        }
        else if (this.currRunShown > state.runs + 1) {
            
        }
        // else {
        //     // Literal
        //     ctx.strokeStyle = 'black';
        //     ctx.lineWidth = 4;
        //     ctx.beginPath();
        //     ctx.moveTo(bitWidth + gap, 240);
        //     ctx.lineTo(compressedWidth - gap, 240);
        //     ctx.stroke();
        //     ctx.font = `20px Arial`;
        //     ctx.fillStyle = 'black';
        //     ctx.fillText(`literal`, bitWidth + gap * 2, 270);
        // }
    
        // Add small text in the bottom right
        ctx.font = `bold 15px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(`word : ${this.currentStateIndex + 1}`, canvasWidth - 100, canvasHeight - 10);
    }
    

    updateCompressedSoFar(lastElement = false) {
        let compressedSoFar = "";
        // this is the number of states we go through we we are on the last element print all states.
        const numOfStates = lastElement ? this.currentStateIndex + 1 : this.currentStateIndex; 
        for (let i = 0; i < numOfStates; i++) {
            compressedSoFar += this.states[i].encodedChunk;
        }
        this.compressedContentElement.innerText = compressedSoFar;
    }

    // transition to the next compressed word or to the end of current one
    transitionNext() {
        
        const fromState = this.states[this.currentStateIndex];
        const fromRun = this.currRunShown;

        if (this.currentStateIndex >= this.states.length - 1) {
            // document.getElementById('nextButton').disabled = true;
            // document.getElementById('microButton').disabled = true;
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
        let fromState = this.states[this.currentStateIndex];
        let fromRun = this.currRunShown;
        const numSteps = fromState.endChunk - fromState.startChunk;

        if (this.currentStateIndex >= this.states.length - 1 && this.currRunShown >= numSteps) {
            this.updateCompressedSoFar(true);
            return;
        }

        if (fromState.runs == 0 || this.currRunShown == numSteps) {
            fromState = this.states[++this.currentStateIndex];
            fromRun = this.currRunShown = 1;
        } else {
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
        this.currRunShown = 1;
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
            console.log(this.currentStateIndex);

            if (progress < 1) {
                requestAnimationFrame(this.animate(fromState, fromRun, startTime).bind(this));
            } else {
                this.drawCanvas(this.states[this.currentStateIndex], 0, this.currRunShown);
                this.updateCompressedSoFar();
            }
        };
    }
}

export default bbcVis;