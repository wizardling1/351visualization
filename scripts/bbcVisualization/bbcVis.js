import { bbcCompress } from "../compression/raw_compression/bbc.js";

// Easing function (ease-in-out)
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

class bbcVis {
    constructor(canvasId, compressedContentId, uncompressed) {
        // Get canvas and context
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Get the output compressed content element
        this.outputText = document.getElementById(compressedContentId);

        // Get uncompressed bits and states
        this.uncompressed = uncompressed.match(/.{1,8}/g) || uncompressed;
        this.states = bbcCompress(uncompressed, true);
        console.log(this.states)
        
        // Keep track of the current state and step
        this.state = 0;
        this.step = 1;

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
        this.drawCanvas(this.states[0]);
    }

    drawCanvas(state, transition = 0, curr_run = 1) {
        
        // Get context, clear canvas
        const ctx = this.ctx;
        const canvasWidth = 600;
        const canvasHeight = 300;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Current chunk index
        const curr_chunk = state.startChunk + curr_run - 1;

        // Number of literals counted at this step
        const litCount = curr_run - state.runs + Math.floor(transition);
        
        // Uncompressed Bits Display
        {   
            // Configure font and get bit width
            ctx.font = `30px monospace`;
            ctx.fillStyle = 'black';
            const bitWidth = ctx.measureText("0").width;

            // Offset = chunk index * 9 (8 bits per chunk + 1 space) * bit width
            const chunk_offset = curr_chunk * 9 * bitWidth;
            
            // Animation = 0 if not animating, otherwise, offset based on transition
            const anim_offset = transition * 9 * bitWidth;

            // 5 -> margin, chunk_offset + anim_offset -> current position
            const start_point = 5 - (chunk_offset + anim_offset);

            // If at the end of run counting, compress the run bytes
            if (state.runs > 1 && curr_run == state.runs)
                this.uncompressed[curr_chunk] = "00....00";
            // Otherwise, display current word and future words, joined by spaces
            else
                this.uncompressed[state.startChunk + state.runs - 1] = "00000000";
            
            ctx.fillText(this.uncompressed.join(" "), start_point, 60);
        
            // Highlight around current step
            let highlightWidth = 8 * bitWidth;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(5, 30, highlightWidth, 40);

            // If we're in a special word, highlight the dirty bit
            if(curr_run > state.runs && state.special){
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                let dbLoc = this.uncompressed[curr_chunk].indexOf("1");
                ctx.fillRect(5 + (dbLoc) * bitWidth, 30, bitWidth, 40);
            }
        }

        // Subtext (beneath uncompressed bits)
        {
            // Configure font and display text
            ctx.font = `22px Arial`;
            ctx.fillStyle = 'black';

            // Display the number of runs (default)
            // Flooring transition allows for dynamic counting
            let runCount = curr_run + Math.floor(transition);
            let top_text = `${runCount} run${runCount == 1 ? '' : 's'} of 0's`;
            
            // If we're not in a run...
            if (curr_run > state.runs) {

                // If we're in a special word, display the dirty bit location
                if (state.special && curr_run == state.runs + 1) {
                    top_text = `DB Location: ${this.uncompressed[curr_chunk].indexOf(1)}`;
                }

                // Otherwise, display the number of literals
                else {
                    // Flooring transition allows for dynamic counting
                    top_text = `${litCount} literal${litCount == 1 ? '' : 's'}`;
                }
            }

            // Display the text
            ctx.fillText(top_text, 20, 100);
        }
    
        // Compressed Test Display
        {   
            let compressed;

            // End of a special chunk, display the encoded byte
            if (curr_run > state.runs && state.special) 
                compressed = state.encodedChunk;

            else{
                // Compress the run count first (header bits 1-3)
                compressed = Math.min(curr_run + Math.floor(transition), 7).toString(2).padStart(3, '0')
                
                // Non-special chunk (header bit 4)
                compressed += "0"; 
                
                // Append literal count if we're at the lit counting step (header bits 5-8)
                compressed += curr_run > state.runs ? Math.min(litCount, 15).toString(2).padStart(4, '0') : "0000";
            }
        
            ctx.font = `bold 110px monospace`;
            ctx.fillStyle = 'black';
            ctx.fillText(compressed, 0, 230);
        }

        const compressedWidth = ctx.measureText("00000000").width;
        const bitWidth = compressedWidth / 8;
        const gap = 5;

        // Header bit
        // Underline first bit
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gap, 240);
        ctx.lineTo(3 * bitWidth - gap, 240);
        ctx.stroke();
        ctx.font = `bold 20px Arial`;
        ctx.fillStyle = 'red';
        let runCount = curr_run + Math.floor(transition);
        ctx.fillText(`${runCount <= 6 ? Math.min(runCount, state.runs) : '6+'} run${runCount == 1 ? '' : 's'} of 0`, gap, 270);

        if (curr_run > state.runs && state.special) {
            // Underline second bit
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(3 * bitWidth + gap, 240);
            ctx.lineTo(4 * bitWidth - gap, 240);
            ctx.stroke();
            ctx.fillStyle = 'blue';
            ctx.fillText(`dirty`, gap + bitWidth * 3, 270);
            
            // Underline rest of the string
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth * 4 + gap, 240);
            ctx.lineTo(compressedWidth - gap, 240);
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.fillText(`DB location/ # of literals`, 4 * bitWidth + gap * 2, 270);
    
        }
        else if (curr_run > state.runs && !state.special) {
            // Underline second bit
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(3 * bitWidth + gap, 240);
            ctx.lineTo(4 * bitWidth - gap, 240);
            ctx.stroke();
            ctx.fillStyle = 'blue';
            ctx.fillText(`no`, gap + bitWidth * 3, 270);
            ctx.fillText(`dirty`, gap + bitWidth * 3, 290);

            // Literal
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bitWidth*4 + gap, 240);
            ctx.lineTo(compressedWidth - gap, 240);
            ctx.stroke();
            ctx.fillStyle = 'black';
            let litCount = curr_run - state.runs + Math.floor(transition)
            ctx.fillText(`${litCount} literal${litCount > 1 ? 's' : ''}`, 4 * bitWidth + gap * 2, 270);
        }
    
        // Add small text in the bottom right
        ctx.font = `bold 15px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(`word : ${this.state + 1}`, canvasWidth - 100, canvasHeight - 10);
    }
    

    updateCompressedSoFar(lastElement = false) {
        let compressedSoFar = [];
        // this is the number of states we go through we we are on the last element print all states.
        const numOfStates = lastElement ? this.state + 1 : this.state; 
        for (let i = 0; i < numOfStates; i++) {
            compressedSoFar.push(this.states[i].encodedChunk);
        }
        this.outputText.innerText = compressedSoFar.join(" ");
    }

    // transition to the next compressed word or to the end of current one
    transitionNext() {
        let currState = this.states[this.state];
        let currStep = this.step;
        const numSteps = currState.endChunk - currState.startChunk;

        // If we're counting runs, skip to the end of the run
        if (currStep < currState.runs) {
            // Set the state step to the end of the runs
            this.step = currState.runs;
            
            // Animate the transition from the current state to the end of the runs
            requestAnimationFrame(this.animate(currState, currStep, performance.now(), currState.runs-currStep).bind(this));
            return;
        }

        // If we're at the end of runs, move to the next step
        if (currStep == currState.runs) {
            this.step += 1;
            requestAnimationFrame(this.animate(currState, currStep, performance.now()).bind(this));
            return;
        }

        // If we're at the end of the last state, we are done
        if (this.state >= this.states.length - 1 && this.step >= numSteps) {
            this.updateCompressedSoFar(true);
            return;
        }

        // If we're at the end of the current state, move to the next state
        if (this.step >= numSteps) {
            currState = this.states[++this.state];
            currStep = 0;
            this.step = 1;
            requestAnimationFrame(this.animate(currState, currStep, performance.now()).bind(this));
        }

        // If we're in the middle of a state, step to the next state
        else{
            // Set the state step to the end of the runs
            this.step = numSteps;
            
            // Animate the transition from the current state to the end of the runs
            requestAnimationFrame(this.animate(currState, currStep, performance.now(), numSteps-currStep).bind(this));
            return;
        }    
    }

    // transition to the next micro step eg.. one more run of current word
    transitionMicro() {
        let fromState = this.states[this.state];
        let fromStep = this.step;
        const numSteps = fromState.endChunk - fromState.startChunk;
        
        // If we are at the end of the last state, we are done
        if (this.state >= this.states.length - 1 && this.step >= numSteps) {
            this.updateCompressedSoFar(true);
            return;
        }

        // If we are at the end of the current state, we move to the next state
        if (this.step == numSteps) {
            fromState = this.states[++this.state];
            
            // Step 0 means transitioning into next chunk
            fromStep = 0; 
            this.step = 1;
        } 
        
        // If we are in the middle of a state, we step to the next step
        else {
            this.step++;
        }

        requestAnimationFrame(this.animate(fromState, fromStep, performance.now(), 1).bind(this));
    }

    // if we are in the middle of a state, or at the end we step back to the beginning
    stepBack() {    
        let fromState = this.states[this.state];
        let fromRun = this.step;

        if ((this.state === 0 && fromState.runs === 0) || (this.state === 0 && fromRun === 1)) {
            return; // we are at the first step
        }

        // if the state was a literal or we were on the first run
        if (fromState.runs === 0 || fromRun === 1) {
            this.state--;
            let prevState = this.states[this.state];
            this.step = prevState.endChunk - prevState.startChunk;
            requestAnimationFrame(this.animate(fromState, fromRun, performance.now(), -1).bind(this));
        }

        // Within run counting step, step back to first run
        else if (fromRun <= fromState.runs) {
            this.step = 1;
            requestAnimationFrame(this.animate(fromState, fromRun, performance.now(), -fromRun + 1).bind(this));
        }

        // On dirty byte or first literal counting step, go back to the end of run counting
        else if (fromRun === fromState.runs + 1) {
            this.step = fromState.runs;
            requestAnimationFrame(this.animate(fromState, fromRun, performance.now(), -1).bind(this));
        }
        
        // Within literal counting step, go back to first literal counting step
        else {
            this.step = fromState.runs + 1;
            requestAnimationFrame(this.animate(fromState, fromRun, performance.now(), fromState.runs - fromRun + 1).bind(this));
        }
    }

    // reset to the beginning
    reset() {
        
        this.state = 0;
        this.step = 1;
        // document.getElementById('nextButton').disabled = false;
        // document.getElementById('microButton').disabled = false;
        this.outputText.innerText = '';
        this.drawCanvas(this.states[this.state]);
        this.updateCompressedSoFar();
    }

    // animate between states.
    animate(fromState, fromRun, startTime, distance = 1) {
        return (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / 750, 1);

            let easedProgress = easeInOutQuad(progress) * distance;

            this.drawCanvas(fromState, easedProgress, fromRun);

            if (progress < 1) {
                requestAnimationFrame(this.animate(fromState, fromRun, startTime, distance).bind(this));
            } else {
                this.drawCanvas(this.states[this.state], 0, this.step);
                this.updateCompressedSoFar();
            }
        };
    }
}

export default bbcVis;