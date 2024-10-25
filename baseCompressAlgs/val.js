const asUnsigned = (num) => typeof num === "bigint" ?
    BigInt.asUintN(64, num) :
    num >>> 0 /* Cast to unsigned, important for 32 bit words */;

const wordAsString = (num, wordSize) => asUnsigned(num).toString(2).padStart(wordSize, '0');

const bitsToString = (bits, length, wordSize) => {
    return Array.from(bits).slice(0, length).map((num) => wordAsString(num, wordSize)).join('');
}


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

// TODO: valCompress and valCompressToNodes can probably share most of their code.

export const valCompress = (index, wordSize, segmentCount) => {
    const scanLength = getValSegmentLength(wordSize, segmentCount);

    const allSegmentsLength = segmentCount * scanLength;

    const output = getTypedArray(wordSize, Math.ceil(index.length / allSegmentsLength));
    const cast = getCast(wordSize);
    const parse = getParse(wordSize, scanLength);

    const maxValue = (cast(1) << cast(scanLength)) - cast(1);
    const maxRunLength = (cast(1) << cast(scanLength - 1)) - cast(1);

    let defaultWord = cast(0);

    for (let i = 0; i < segmentCount; i++) {
        defaultWord |= cast(1) << cast(wordSize - i - 1);
    }

    let outputIndex = 0;
    let isInRun = false;
    let runLength = 0;
    let runType = 0;
    let i = 0;

    let pendingWord = defaultWord;
    let pendingCount = 0;

    const outputRun = () => {
        ++pendingCount;
        pendingWord |= ((cast(runType) << cast(scanLength - 1)) | cast(runLength)) << cast((segmentCount - pendingCount) * scanLength);

        flushPendingSegments();
    }

    const flushPendingSegments = (isForced) => {
        if (pendingCount == segmentCount || (pendingCount > 0 && isForced)) {
            output[outputIndex] = pendingWord;
            ++outputIndex;

            pendingCount = 0;
            pendingWord = defaultWord;
        }
    }

    const handleRun = (currentType) => {
        if (isInRun) {
            if (runType != currentType || runLength == maxRunLength) {
                outputRun();
                runLength = 1;
                runType = currentType;
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
            pendingWord &= ~(cast(1) << cast(wordSize - pendingCount));
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
        str: bitsToString(output, outputIndex, wordSize),
    };
}

// Similar to valCompress, except it generates nodes for the animation system.
// Outputs the same nodes as WAH, which the animation system can instead represent
// as VAL if it knows the segment count.
export const valCompressToNodes = (index, wordSize, segmentCount) => {
    const scanLength = getValSegmentLength(wordSize, segmentCount);

    const output = [];
    const cast = getCast(wordSize);
    const parse = getParse(wordSize, scanLength);

    const maxValue = (cast(1) << cast(scanLength)) - cast(1);
    const maxRunLength = (cast(1) << cast(scanLength - 1)) - cast(1);

    let defaultWord = cast(0);

    for (let i = 0; i < segmentCount; i++) {
        defaultWord |= cast(1) << cast(wordSize - i - 1);
    }

    let isInRun = false;
    let runLength = 0;
    let runType = 0;
    let i = 0;
    let startIndex = 0;

    let pendingWord = defaultWord;
    let pendingCount = 0;

    const outputRun = () => {
        ++pendingCount;
        pendingWord |= ((cast(runType) << cast(scanLength - 1)) | cast(runLength)) << cast((segmentCount - pendingCount) * scanLength);
        
        output.push({
            runs: runLength,
            runType: runType == 0 ? '0' : '1',
            litSize: scanLength,
            startIndex,
            compressed: wordAsString(pendingWord, wordSize),
            step: output.length,
        });

        startIndex = i;

        flushPendingSegments();
    }

    const flushPendingSegments = (isForced) => {
        if (pendingCount == segmentCount || (pendingCount > 0 && isForced)) {
            pendingCount = 0;
            pendingWord = defaultWord;
        }
    }

    const handleRun = (currentType) => {
        if (isInRun) {
            if (runType != currentType || runLength == maxRunLength) {
                outputRun();
                startIndex -= scanLength;
                runLength = 1;
                runType = currentType;
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
                startIndex -= scanLength;
                runLength = 0;
                runType = 0;
                isInRun = false;
            }

            ++pendingCount;
            pendingWord &= ~(cast(1) << cast(wordSize - pendingCount));
            pendingWord |= nextBits << cast((segmentCount - pendingCount) * scanLength);

            output.push({
                runs: 0,
                runType: '0',
                litSize: scanLength,
                startIndex,
                compressed: wordAsString(pendingWord, wordSize),
                step: output.length,
            });

            startIndex = i;

            flushPendingSegments();
        }
    }

    if (isInRun) {
        outputRun();
    }

    flushPendingSegments(true);

    return output;
}

// Helps when testing valCompress.
export const valDecompress = (compressed, wordSize, segmentCount, outputLength) => {
    const scanLength = getValSegmentLength(wordSize, segmentCount);
    const cast = getCast(wordSize);

    const maxValue = (cast(1) << cast(scanLength)) - cast(1);
    const runLengthMask = (cast(1) << cast(scanLength - 1)) - cast(1);

    const index = [];

    for (let wordI = 0; wordI < compressed.length; ++wordI) {
        const word = compressed.compressed[wordI];

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

    return {
        compressed: index,
        length: index.length,
        str: bitsToString(index, index.length, getValSegmentLength(wordSize, segmentCount))
            .slice(0, outputLength),
    };
}
