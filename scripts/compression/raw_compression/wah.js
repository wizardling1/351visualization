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

const bitsToString = (bits, length, wordSize) => {
    const asUnsigned = (num) => typeof num === "bigint" ? BigInt.asUintN(64, num) : num;
    return Array.from(bits).slice(0, length).map(
        num => asUnsigned(num).toString(2).padStart(wordSize, '0')
    ).join('');
}

const getParse = (wordSize, scanLength) => wordSize > 32 ?
    (str) => BigInt(("0b" + str)) << BigInt(scanLength - str.length) :
    (str) => parseInt(str, 2) << (scanLength - str.length);

const getCast = (wordSize) => wordSize > 32 ?
    BigInt :
    (x) => x;

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

const asUnsigned = (num, wordSize) => typeof num === "bigint" ? BigInt.asUintN(wordSize, num) : num >>> 0;

export const wahCompress = (string, wordSize, returnStates = false) => {
    let numChunks = Math.ceil(string.length / (wordSize - 1));
    let index = 0;

    let compressed = getTypedArray(wordSize, numChunks);
    const parse = getParse(wordSize, wordSize - 1);
    const cast = getCast(wordSize);

    let runOnes = cast(0);
    let runZeros = cast(0);
    let chunkSize = wordSize - 1;
    let onesNum = (cast(1 >>> 0) << cast(chunkSize)) - cast(1);
    let maxRunSize = (cast(1) << cast(wordSize - 2)) - cast(1);
    let lastchunkflg = 0;

    let states = [];
    let currentStartIndex = 0;

    for (let i = 0; i < string.length; i += chunkSize) {
        let chunkStr = string.slice(i, i + chunkSize);
        let chunk = parse(chunkStr);
        if (i + chunkSize > string.length) {
            lastchunkflg = 1;
        }

        if (chunk == 0 && lastchunkflg == 0) {
            if (runOnes > 0) { //RUN OF 1's ended, run of 0's started
                getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast);
                if (returnStates) {
                    states.push({
                        runs: Number(runOnes),
                        runType: '1',
                        startIndex: currentStartIndex,
                        compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                    });
                }
                runOnes = cast(0);
                currentStartIndex = i;
            }
            if (runZeros == 0) {
                currentStartIndex = i;
            }
            runZeros++;  //"RUN OF 0's
            if (runZeros >= maxRunSize) {
                getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast);
                if (returnStates) {
                    states.push({
                        runs: Number(runZeros),
                        runType: '0',
                        startIndex: currentStartIndex,
                        compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                    });
                }
                runZeros = cast(0);
                currentStartIndex = i + chunkSize;
            }
        } else if ((chunk ^ onesNum) == 0 && lastchunkflg == 0) {//RUN OF 1's
            if (runZeros > 0) {
                getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast);
                if (returnStates) {
                    states.push({
                        runs: Number(runZeros),
                        runType: '0',
                        startIndex: currentStartIndex,
                        compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                    });
                }
                runZeros = cast(0);
                currentStartIndex = i;
            }
            if (runOnes == 0) {
                currentStartIndex = i;
            }
            runOnes++;
            if (runOnes >= maxRunSize) { //RUN OF 1's ended
                getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast);
                if (returnStates) {
                    states.push({
                        runs: Number(runOnes),
                        runType: '1',
                        startIndex: currentStartIndex,
                        compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                    });
                }
                runOnes = cast(0);
                currentStartIndex = i + chunkSize;
            }
        } else {
            if (runOnes > 0) {//encode run of 1s first
                getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast);
                if (returnStates) {
                    states.push({
                        runs: Number(runOnes),
                        runType: '1',
                        startIndex: currentStartIndex,
                        compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                    });
                }
                runOnes = cast(0);
            } else if (runZeros > 0) {//encode run of 0s first
                getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast);
                if (returnStates) {
                    states.push({
                        runs: Number(runZeros),
                        runType: '0',
                        startIndex: currentStartIndex,
                        compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                    });
                }
                runZeros = cast(0);
            }
            // encode Literal
            getWahCompression(0, 0, chunk, wordSize, compressed, index++, cast);
            if (returnStates) {
                states.push({
                    runs: 0,
                    runType: '',
                    startIndex: i,
                    compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
                });
            }
            currentStartIndex = i + chunkSize;
        }
    }

    if (runOnes > 0) {//encode run of 1"
        getWahCompression(runOnes, 1, null, wordSize, compressed, index++, cast);
        if (returnStates) {
            states.push({
                runs: Number(runOnes),
                runType: '1',
                startIndex: currentStartIndex,
                compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
            });
        }
    } else if (runZeros > 0) {//encode run of 0
        getWahCompression(runZeros, 0, null, wordSize, compressed, index++, cast);
        if (returnStates) {
            states.push({
                runs: Number(runZeros),
                runType: '0',
                startIndex: currentStartIndex,
                compressed: asUnsigned(compressed[index - 1], wordSize).toString(2).padStart(wordSize, '0'),
            });
        }
    }

    return returnStates ? states : {
        compressed: compressed,
        length: index,
        str: bitsToString(compressed, index, wordSize),
    };
}
