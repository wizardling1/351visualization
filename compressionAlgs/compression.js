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

export const getValSegmentLength = (wordSize, segmentCount) => {
    const scanLength = (wordSize - segmentCount) / segmentCount;
    console.assert(scanLength == (scanLength | 0), "Word size does not divide cleanly by segment count!");

    return scanLength;
}

const getWahCompression = (numRuns, runOf, chunkarr, wordSize, compressed, index, cast) => {
    if (numRuns != 0) {
        let header = cast(1) << cast(wordSize - 1)

        if (runOf == 1) {
            header |= cast(1) << cast(wordSize - 2)
        }

        numRuns |= header
        compressed[index] = numRuns
    }
    else { //literal
        compressed[index] = chunkarr
    }

}

export const wahCompress = (string, wordSize) => {
    let numChunks = Math.ceil(string.length / (wordSize - 1))
    let index = 0

    let compressed = getTypedArray(wordSize, numChunks)
    const parse = getParse(wordSize, wordSize - 1)
    const cast = getCast(wordSize);

    let runOnes = cast(0)
    let runZeros = cast(0)
    let chunkSize = wordSize - 1
    let onesNum = (cast(1 >>> 0) << cast(chunkSize)) - cast(1)
    let maxRunSize = (cast(1) << cast(wordSize - 2)) - cast(1)
    let lastchunkflg = 0

    for (let i = 0; i < string.length; i += chunkSize) {
        let chunkStr = string.slice(i, i + chunkSize);
        let chunk = parse(chunkStr);
        if (i + chunkSize >= string.length) {
            lastchunkflg = 1
        }

        if (chunk == 0 && lastchunkflg == 0) {
            if (runOnes > 0) { //RUN OF 1's ended, run of 0's started
                getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast)
                runOnes = cast(0)
            }
            runZeros++  //"RUN OF 0's
            if (runZeros >= maxRunSize) {
                getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast)
                runZeros = cast(0)
            }
        }
        // Comparison here is (chunk ^ onesNum) == 0 instead of chunk == onesNum because with a word size of 32,
        // JS sometimes may interpret chunk as an unsigned int and onesNum as a signed int which breaks == comparison.
        else if ((chunk ^ onesNum) == 0 && lastchunkflg == 0) {//RUN OF 1's
            if (runZeros > 0) {
                getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast)
                runZeros = cast(0)
            }
            runOnes++
            if (runOnes >= maxRunSize) { //RUN OF 1's ended
                getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast)
                runOnes = cast(0)
            }
        }
        else {
            if (runOnes > 0) {//encode run of 1s first
                getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast)
                runOnes = cast(0)
            }
            else if (runZeros > 0) {//encode run of 0s first
                getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast)
                runZeros = cast(0)
            }
            // encode Literal
            getWahCompression(0, 0, chunk, wordSize, compressed, index++, cast)
        }


    }

    if (runOnes > 0) {//encode run of 1"
        getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast)
    }
    else if (runZeros > 0) {//encode run of 0
        getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast)
    }

    return {
        compressed,
        length: index,
    }
}

export const valCompress = (index, wordSize, segmentCount) => {
    const scanLength = getValSegmentLength(wordSize, segmentCount);

    const allSegmentsLength = segmentCount * scanLength;
    // index = index.padEnd(Math.ceil(index.length / allSegmentsLength) * allSegmentsLength, '0');

    const output = getTypedArray(wordSize, Math.ceil(index.length / allSegmentsLength));
    const cast = getCast(wordSize);
    const parse = getParse(wordSize, scanLength);

    const maxValue = (cast(1) << cast(scanLength)) - cast(1);

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

    const maxValue = (cast(1) << cast(scanLength)) - cast(1);
    const runLengthMask = (cast(1) << cast(scanLength - 1)) - cast(1);

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
            const typeBit = (segment >> cast(scanLength - 1)) & cast(1);
            const runLength = segment & cast(runLengthMask);
            const runValue = typeBit == 1 ? maxValue : 0;

            for (let runI = 0; runI < runLength; ++runI) {
                index.push(runValue);
            }
        }
    }

    return index;
}
