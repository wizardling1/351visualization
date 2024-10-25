const isRun = (byte) => {
    return byte == 0;
}

const isDirty = (byte) => {
    return byte != 0 && Math.log2(byte) == Math.floor(Math.log2(byte));
}

const encodeRuns = (numRuns, endHeader) => {
    if (numRuns <= 6) {
        let out = new Uint8Array(1);
        out[0] = (numRuns << 5) | endHeader;
        return out;
    }
    else if (numRuns <= 2**7-1) {
        let out = new Uint8Array(2);
        out[0] = (0b111 << 5) | endHeader;
        out[1] = numRuns;
        return out; 
    }
    else if (numRuns <= 2**15-1) {
        let out = new Uint8Array(3);
        out[0] = (0b111 << 5) | endHeader;
        out[1] = 0b10000000 | (numRuns >> 8);
        out[2] = numRuns & 0b11111111;
        return out;
    }
    else {
        console.err("Too many runs (" + numRuns + ") passed to encodeRuns!");
    }
}

const encodeSpecialChunk = (numRuns, dirtyByte) => {
    let dirtyBitLoc = 8 - Math.log2(dirtyByte) - 1;
    let endHeader = 0b10000 | dirtyBitLoc;
    return encodeRuns(numRuns, endHeader);
}

const encodeNormalChunk = (numRuns, literals) => {
    if (literals.length > 2**4-1) {
        console.err("Too many literals passed to encodeNormalChunk (" + literals.length + ")!");
    }
    let chunk = encodeRuns(numRuns, literals.length);
    let out = new Uint8Array(chunk.length + literals.length);
    out.set(chunk, 0);
    out.set(literals, chunk.length);
    return out;
}

const uint8ArrayToStrings = (arr) => {
    let strs = []
    for (let c of arr) {
        let str = c.toString(2).padStart(8, '0');
        strs.push(str);
    }
    return strs;
}

export const bbcCompress = (index) => {
    const maxRuns = 2**15-1;
    const maxLiterals = 2**4-1;

    // convert str index into Uint8 array
    const numWords = Math.ceil(index.length / 8);
    const paddedIndex = index.padEnd(numWords * 8, '0');
    const inputArray = new Uint8Array(numWords);
    for (let i = 0; i < paddedIndex.length; i += 8) {
        const byte = paddedIndex.slice(i, i+8);
        inputArray[i/8] = parseInt(byte, 2);
    }

    let chunks = [];
    let inRuns = true;
    let numRuns = 0;
    let savedDirtyByte = null;
    let literals = [];
    for (let byte of inputArray) {
        // if in runs
        if (inRuns) {
            if (isRun(byte)) {
                // if run encountered right after dirty byte, encode DB and previous runs
                if (savedDirtyByte != null) {
                    chunks.push(encodeSpecialChunk(numRuns, savedDirtyByte));
                    savedDirtyByte = null;
                    numRuns = 0;
                }
                numRuns++;
                if (numRuns >= maxRuns) {
                    chunks.push(encodeNormalChunk(numRuns, literals));
                    numRuns = 0;
                    literals  = [];
                }
            }
            else if (isDirty(byte)) {
                // if two dirty bytes in a row, both are treated as literals
                if (savedDirtyByte != null) {
                    literals.push(savedDirtyByte);
                    literals.push(byte);
                    savedDirtyByte = null;
                    inRuns = false;
                }
                else {
                    savedDirtyByte = byte;
                }
            }
            else {
                if (savedDirtyByte != null) {
                    // if dirty byte as found, but literals was next, turn dirty into literal
                    literals.push(savedDirtyByte);
                    savedDirtyByte = null;
                }
                literals.push(byte);
                inRuns = false;
            }
        }
        // if not in runs
        else {
            if (isRun(byte)) {
                chunks.push(encodeNormalChunk(numRuns, literals));
                numRuns = 1;
                literals = [];
                inRuns = true;
            }
            else {
                literals.push(byte);
                if (literals.length >= maxLiterals) {
                    chunks.push(encodeNormalChunk(numRuns, literals));
                    numRuns = 0;
                    literals = [];
                    inRuns = true;
                }
            }
        }
    }

    if (savedDirtyByte != null && inRuns) {
        chunks.push(encodeSpecialChunk(numRuns, savedDirtyByte));
    }
    else if (literals.length > 0 || numRuns > 0) {
        chunks.push(encodeNormalChunk(numRuns, literals));
    }
    
    // convert uint8 chunks into a string
    let strs = []
    for (let c of chunks) {
        // concat is slow; can optimize here.
        strs = strs.concat(uint8ArrayToStrings(c));
    }
    return strs.join('');
}
