const getTypedArray = (wordSize, numChunks) => {
    switch (wordSize) {
        case 8:
            return new Uint8Array(numChunks); // 1 byte per chunk
        case 16:
            return new Uint16Array(numChunks); // 2 bytes per chunk
        case 32:
            return new Uint32Array(numChunks); // 4 bytes per chunk
        case 64:
            return new BigInt64Array(numChunks); // 8 bytes per chunk
        default:
            throw new Error("Unsupported word size. Choose 8, 16, 32, or 64.");
    }
}

const getParse = (wordSize, scanLength) => wordSize > 32 ?
    (str) => BigInt(("0b" + str)) << BigInt(scanLength - str.length) :
    (str) => parseInt(str, 2) << (scanLength - str.length);

const getCast = (wordSize) => wordSize > 32 ?
    BigInt :
    (x) => x;

const uint8ArrayToStrings = (arr) => {
    let strs = [];
    for (let c of arr) {
        let str = c.toString(2).padStart(8, '0');
        strs.push(str);
    }
    return strs;
}


export const getValSegmentLength = (wordSize, segmentCount) => {
    const scanLength = (wordSize - segmentCount) / segmentCount;
    console.assert(scanLength == (scanLength | 0), "Word size does not divide cleanly by segment count!");

    return scanLength;
}

export const wahCompress = (index, wordSize) => {
    const scanLength = wordSize - 1;
    const maxValue = (1 << scanLength) - 1;

    const output = getTypedArray(wordSize, Math.ceil(index.length / scanLength));
    const cast = getCast(wordSize);
    const parse = getParse(wordSize, scanLength);

    let outputIndex = 0;
    let isInRun = false;
    let runLength = 0;
    let runType = 0;
    let i = 0;

    const outputRun = () => {
        output[outputIndex] = (cast(1) << scanLength) | (cast(runType) << (scanLength - 1)) | cast(runLength);
        ++outputIndex;
    }

    const handleRun = (currentType) => {
        if (isInRun) {
            if (runType != currentType) {
                outputRun();
                runLength = 1;
                runType = 1 - currentType;
            } else {
                ++runLength;
            }
        } else {
            isInRun = true;
            runLength = 1;
            runType = currentType;
        }
    }

    while (i < index.length) {
        let chunkLength = Math.min(scanLength, index.length - i);
        let isEndingBits = chunkLength < scanLength;
        let nextBits = parse(index.slice(i, i + chunkLength));

        i += scanLength;

        if (!isEndingBits && nextBits == maxValue) {
            // Found all 1s.
            handleRun(1);
        } else if (!isEndingBits && nextBits == 0) {
            // Found all 0s.
            handleRun(0);
        } else {
            // Found a literal.
            if (isInRun) {
                outputRun();
                runLength = 0;
                runType = 0;
                isInRun = false;
            }

            output[outputIndex] = nextBits;
            ++outputIndex;
        }
    }

    /* I added a new compressed_string here */
    

    return {
        compressed: output,
        length: outputIndex,
    };
}

export const valCompress = (index, wordSize, segmentCount) => {
    const scanLength = getValSegmentLength(wordSize, segmentCount);

    const allSegmentsLength = segmentCount * scanLength;
    // index = index.padEnd(Math.ceil(index.length / allSegmentsLength) * allSegmentsLength, '0');

    const maxValue = (1 << scanLength) - 1;

    const output = getTypedArray(wordSize, Math.ceil(index.length / allSegmentsLength));
    const cast = getCast(wordSize);
    const parse = getParse(wordSize, scanLength);

    let outputIndex = 0;
    let isInRun = false;
    let runLength = 0;
    let runType = 0;
    let i = 0;

    let pendingWord = cast(0);
    let pendingCount = 0;

    const outputRun = () => {
        ++pendingCount;
        pendingWord |= ((cast(runType) << cast(scanLength - 1)) | cast(runLength)) << cast((segmentCount - pendingCount) * scanLength);
        pendingWord |= cast(1) << cast(wordSize - pendingCount);

        flushPendingSegments();
    }

    const flushPendingSegments = (isForced) => {
        if (pendingCount == segmentCount || (pendingCount > 0 && isForced)) {
            output[outputIndex] = pendingWord;
            ++outputIndex;

            pendingCount = 0;
            pendingWord = cast(0);
        }
    }

    const handleRun = (currentType) => {
        if (isInRun) {
            if (runType != currentType) {
                outputRun();
                runLength = 1;
                runType = 1 - currentType;
            } else {
                ++runLength;
            }
        } else {
            isInRun = true;
            runLength = 1;
            runType = currentType;
        }
    }

    while (i < index.length) {
        let chunkLength = Math.min(scanLength, index.length - i);
        let isEndingBits = chunkLength < scanLength;
        let nextBits = parse(index.slice(i, i + chunkLength));

        i += scanLength;

        if (!isEndingBits && nextBits == maxValue) {
            // Found all 1s.
            handleRun(1);
        } else if (!isEndingBits && nextBits == 0) {
            // Found all 0s.
            handleRun(0);
        } else {
            // Found a literal.
            if (isInRun) {
                outputRun();
                runLength = 0;
                runType = 0;
                isInRun = false;
            }

            ++pendingCount;
            pendingWord |= nextBits << cast((segmentCount - pendingCount) * scanLength);
            flushPendingSegments();
        }
    }

    if (isInRun) {
        outputRun();
    }

    flushPendingSegments(true);

    return {
        compressed: output,
        length: outputIndex,
    };
}

// Helps when testing valCompress.
export const valDecompress = (compressed, length, wordSize, segmentCount) => {
    const scanLength = getValSegmentLength(wordSize, segmentCount);
    const cast = getCast(wordSize);

    const maxValue = (1 << scanLength) - 1;
    const runLengthMask = (1 << (scanLength - 1)) - 1;

    const index = [];

    for (let wordI = 0; wordI < length; ++wordI) {
        const word = compressed[wordI];

        for (let segmentI = 0; segmentI < segmentCount; ++segmentI) {
            const headerBit = (word >> cast(wordSize - 1 - segmentI)) & cast(1);
            const segment = (word >> cast(scanLength * (segmentCount - 1 - segmentI))) & cast(maxValue);

            if (headerBit == 0) {
                // Found a literal.
                index.push(segment);
                continue;
            }

            // Found a run.
            const typeBit = (segment >> (scanLength - 1)) & 1;
            const runLength = segment & runLengthMask;
            const runValue = typeBit == 1 ? maxValue : 0;

            for (let runI = 0; runI < runLength; ++runI) {
                index.push(runValue);
            }
        }
    }

    return index;
}
