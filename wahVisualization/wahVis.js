class wahVis {
    constructor(canvasId, compressedContentId, states, litSize) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.compressedContentElement = document.getElementById(compressedContentId);
        this.states = states;
        this.litSize = litSize;

        this.currentStateIndex = 0;
        this.currRunShown = 0;

        this.uncompressed = '010100100000000000000000000011111111111111111111111111111110101';

        // Canvas setup
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 600 * dpr;
        this.canvas.height = 300 * dpr;
        this.canvas.style.width = '600px';
        this.canvas.style.height = '300px';
        this.ctx.scale(dpr, dpr);

        // Initial draw
        this.drawCanvas(this.states[this.currentStateIndex]);
        this.updateCompressedSoFar();
    }

    drawCanvas(state, transition = 0, curr_run = state.runs) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const dpr = window.devicePixelRatio || 1;

        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Uncompressed display
        ctx.font = '30px monospace';
        ctx.fillStyle = 'black';

        let compressedFontSize = Math.min(130, canvas.width / dpr / state.compressed.length * 1.4);

        const uncompressedDigitWidth = ctx.measureText("0").width;
        const start_point = 5 - (transition * this.litSize * uncompressedDigitWidth);
        // Calculate the number of digits that can fit in the canvas width
        const canFit = Math.ceil(canvas.width / dpr / uncompressedDigitWidth);
        let current_uncompressed;

        if (state.runs > 1 && curr_run == state.runs) {    // here we simplify the runs displayed

            // the simplifyString function turns a bunch of runs into 11..11
            let simplifiedString = simplifyString(state.runType, this.litSize);
            const new_start = state.startIndex + this.litSize * state.runs;
            current_uncompressed = simplifiedString + this.uncompressed.substring(new_start, new_start + canFit);
        } else {
            let curr_offset = curr_run === 0 ? 0 : (curr_run - 1) * this.litSize;
            current_uncompressed = this.uncompressed.substring(state.startIndex + curr_offset, state.startIndex + canFit + this.litSize + curr_offset);
        }

        let highlightWidth = this.litSize * uncompressedDigitWidth;
        ctx.fillText(current_uncompressed, start_point, 60);

        // Highlight around current step
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(5, 30, highlightWidth, 40);

        // Subtext
        ctx.font = '22px Arial';
        ctx.fillStyle = 'black';
        let top_text = state.runs === 0 ? 'Literal' : `${curr_run} runs of ${state.runType}'s`;
        ctx.fillText(top_text, 20, 100);

        // Compressed
        let compressed = state.runs === 0 ? state.compressed : `1${state.runType}${decimalToBinary(curr_run, this.litSize - 1)}`;


        ctx.font = `bold ${compressedFontSize}px monospace`;
        ctx.fillStyle = 'black';
        ctx.fillText(compressed, 0, 230);

        const compressedWidth = ctx.measureText(state.compressed).width;
        const bitWidth = compressedWidth / state.compressed.length;
        const gap = 5;

        if (state.runs > 0) {
            // Underline first bit
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(gap, 240);
            ctx.lineTo(bitWidth - gap, 240);
            ctx.stroke();
            ctx.font = '20px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText('run', gap, 270);

            // Underline second bit
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth + gap, 240);
            ctx.lineTo(2 * bitWidth - gap, 240);
            ctx.stroke();
            ctx.fillText(`of ${state.runType}'s`, gap + bitWidth, 270);

            // Underline rest of the string
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth * 2 + gap, 240);
            ctx.lineTo(compressedWidth - gap, 240);
            ctx.stroke();
            ctx.fillText(`${curr_run} times`, 2 * bitWidth + gap * 2, 270);

        } else {
            // Literal
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth + gap, 240);
            ctx.lineTo(compressedWidth - gap, 240);
            ctx.stroke();
            ctx.font = '20px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(`literal`, bitWidth + gap * 2, 270);
        }

        // Add small text in the bottom right
        ctx.font = 'bold 15px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(`word : ${state.step}`, canvas.width / dpr - 100, canvas.height / dpr - 10);
    }

    updateCompressedSoFar(lastElement = false) {
        let compressedSoFar = "";
        // this is the number of states we go through we we are on the last element print all states.
        const numOfStates = lastElement ? this.currentStateIndex + 1 : this.currentStateIndex; 
        for (let i = 0; i < numOfStates; i++) {
            compressedSoFar += this.states[i].compressed;
        }
        this.compressedContentElement.innerText = compressedSoFar;
    }

    // transition to the next compressed word or to the end of current one
    transitionNext() {
        
        const fromState = this.states[this.currentStateIndex];
        const fromRun = this.currRunShown;

        if (this.currentStateIndex >= this.states.length - 1) {
            document.getElementById('nextButton').disabled = true;
            document.getElementById('microButton').disabled = true;
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

        if (this.currentStateIndex >= this.states.length - 1 && this.currRunShown >= fromState.runs) {
            document.getElementById('nextButton').disabled = true;
            document.getElementById('microButton').disabled = true;
            this.updateCompressedSoFar(true);
            return;
        }

        if (fromState.runs == 0 || this.currRunShown == fromState.runs) {
            this.currentStateIndex++;
            this.currRunShown = 1;
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
        this.currRunShown = this.states[this.currentStateIndex].runs;
        document.getElementById('nextButton').disabled = false;
        document.getElementById('microButton').disabled = false;
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
