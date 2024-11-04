const getParse = (wordSize, scanLength) =>
    wordSize > 32
        ? (str) => BigInt("0b" + str.padEnd(scanLength, '0'))
        : (str) => parseInt(str.padEnd(scanLength, '0'), 2);

const getCast = (wordSize) => (wordSize > 32 ? BigInt : (x) => x);

const getWahCompressedWord = (numRuns, runOf, chunkarr, wordSize, cast) => {
    let compressedWord;
    if (numRuns != 0) {
        let header = cast(1) << cast(wordSize - 1);

        if (runOf == 1) {
            header |= cast(1) << cast(wordSize - 2);
        }

        numRuns = (cast(numRuns) & (cast(Math.pow(2, wordSize - 2) - 1))) | header;
        compressedWord = numRuns;
    } else {
        // Literal
        compressedWord = chunkarr;
    }

    return compressedWord;
};

// Helper function to handle unsigned conversion
const asUnsigned = (num, wordSize) =>
    typeof num === "bigint" ? BigInt.asUintN(wordSize, num) : num >>> 0;

export const wahCompressWithStates = (string, wordSize) => {
    const cast = getCast(wordSize);
    const parse = getParse(wordSize, wordSize - 1);

    let runOnes = cast(0);
    let runZeros = cast(0);
    let chunkSize = wordSize - 1;
    let onesNum = (cast(1) << cast(chunkSize)) - cast(1);
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
            if (runOnes > 0) {
                // Run of 1's ended, run of 0's started
                let compressedWord = getWahCompressedWord(runOnes, 1, null, wordSize, cast);
                states.push({
                    runs: Number(runOnes),
                    runType: '1',
                    startIndex: currentStartIndex,
                    compressed: asUnsigned(compressedWord, wordSize)
                        .toString(2)
                        .padStart(wordSize, '0'),
                });
                runOnes = cast(0);
                currentStartIndex = i;
            }
            if (runZeros == 0) {
                currentStartIndex = i;
            }
            runZeros++; // Run of 0's
            if (runZeros >= maxRunSize) {
                let compressedWord = getWahCompressedWord(runZeros, 0, null, wordSize, cast);
                states.push({
                    runs: Number(runZeros),
                    runType: '0',
                    startIndex: currentStartIndex,
                    compressed: asUnsigned(compressedWord, wordSize)
                        .toString(2)
                        .padStart(wordSize, '0'),
                });
                runZeros = cast(0);
                currentStartIndex = i + chunkSize;
            }
        } else if ((chunk ^ onesNum) == 0 && lastchunkflg == 0) {
            // Run of 1's
            if (runZeros > 0) {
                // Run of 0's ended
                let compressedWord = getWahCompressedWord(runZeros, 0, null, wordSize, cast);
                states.push({
                    runs: Number(runZeros),
                    runType: '0',
                    startIndex: currentStartIndex,
                    compressed: asUnsigned(compressedWord, wordSize)
                        .toString(2)
                        .padStart(wordSize, '0'),
                });
                runZeros = cast(0);
                currentStartIndex = i;
            }
            if (runOnes == 0) {
                currentStartIndex = i;
            }
            runOnes++;
            if (runOnes >= maxRunSize) {
                // Run of 1's ended
                let compressedWord = getWahCompressedWord(runOnes, 1, null, wordSize, cast);
                states.push({
                    runs: Number(runOnes),
                    runType: '1',
                    startIndex: currentStartIndex,
                    compressed: asUnsigned(compressedWord, wordSize)
                        .toString(2)
                        .padStart(wordSize, '0'),
                });
                runOnes = cast(0);
                currentStartIndex = i + chunkSize;
            }
        } else {
            if (runOnes > 0) {
                // Encode run of 1's first
                let compressedWord = getWahCompressedWord(runOnes, 1, null, wordSize, cast);
                states.push({
                    runs: Number(runOnes),
                    runType: '1',
                    startIndex: currentStartIndex,
                    compressed: asUnsigned(compressedWord, wordSize)
                        .toString(2)
                        .padStart(wordSize, '0'),
                });
                runOnes = cast(0);
            } else if (runZeros > 0) {
                // Encode run of 0's first
                let compressedWord = getWahCompressedWord(runZeros, 0, null, wordSize, cast);
                states.push({
                    runs: Number(runZeros),
                    runType: '0',
                    startIndex: currentStartIndex,
                    compressed: asUnsigned(compressedWord, wordSize)
                        .toString(2)
                        .padStart(wordSize, '0'),
                });
                runZeros = cast(0);
            }
            // Encode Literal
            let compressedWord = getWahCompressedWord(0, 0, chunk, wordSize, cast);
            states.push({
                runs: 0,
                runType: '',
                startIndex: i,
                compressed: asUnsigned(compressedWord, wordSize)
                    .toString(2)
                    .padStart(wordSize, '0'),
            });
            currentStartIndex = i + chunkSize;
        }
    }

    if (runOnes > 0) {
        // Encode remaining run of 1's
        let compressedWord = getWahCompressedWord(runOnes, 1, null, wordSize, cast);
        states.push({
            runs: Number(runOnes),
            runType: '1',
            startIndex: currentStartIndex,
            compressed: asUnsigned(compressedWord, wordSize)
                .toString(2)
                .padStart(wordSize, '0'),
        });
    } else if (runZeros > 0) {
        // Encode remaining run of 0's
        let compressedWord = getWahCompressedWord(runZeros, 0, null, wordSize, cast);
        states.push({
            runs: Number(runZeros),
            runType: '0',
            startIndex: currentStartIndex,
            compressed: asUnsigned(compressedWord, wordSize)
                .toString(2)
                .padStart(wordSize, '0'),
        });
    }

    return states;
};
