import * as fs from 'fs';
import { bbcCompress  } from './bbc.js';
import { wahCompress, valCompress, valDecompress } from './compression.js';

const bitsToString = (arr, wordSize) => {
    return Array.from(arr).map(
        num => num.toString(2).padStart(wordSize, '0')
    ).join('');
}

const diffStrings = (expected, actual) => {
    const seekBefore = 20;
    const seekAfter = 20;
    const viewStr = (str, startIndex) => {
        let before = str.substring(
                Math.max(0, startIndex-seekBefore), 
                startIndex
        );
        if (before.length > 0) before = "..." + before;
        before = before.padStart(seekBefore+3, ' ');
        let after = str.substring(
            startIndex, 
            Math.min(str.length-1, startIndex+seekAfter)
        ) + (str.length-1 > startIndex+seekAfter ? "..." : "" );
        return before + after;
    }
    const zipLen = Math.min(expected.length, actual.length);

    for (let i = 0; i < zipLen; i++) {
        if (expected[i] != actual[i]) {
            console.log(`\nstrings differ: expected[${i}] = ${expected[i]}, actual[${i}] = ${actual[i]}`);
            console.log("expected: " + viewStr(expected, i));
            console.log("actual:   " + viewStr(actual, i));
            console.log("          " + " ".repeat(seekBefore+3) + "^");
            return false;
        }
    }

    if (expected.length != actual.length) {
        if (expected.length < actual.length) {
            console.log("Actual str longer than expected str! (but agree up to that point.)");
            console.log("actual.length = " + actual.length + ", expected.length = " + expected.length);
            console.log("expected: " + viewStr(expected, expected.length-1));
            console.log("actual:   " + viewStr(actual, expected.length-1));
            console.log("          " + " ".repeat(seekBefore+3) + "^");
        }
        else {
            console.log("Actual str shorter than expected str! (but agree up to that point.)");
            console.log("actual.length = " + actual.length + ", expected.length = " + expected.length);
            console.log("expected: " + viewStr(expected, actual.length-1));
            console.log("actual:   " + viewStr(actual, actual.length-1));
            console.log("          " + " ".repeat(seekBefore+3) + "^");
        }
        return false;
    }
    return true;
}

const getColumns = (input) => {
    const rows = input.trim().split('\n');
    const numCols = rows[0].length;
    const columns = Array.from({length: numCols}, () => '');
    for (let row of rows) {
        for (let i = 0; i < numCols; i++) {
            columns[i] += row[i];
        }
    }
    return columns;
}

const testCompressionAlg = (compressionAlg, inputFile, expectedOutputFile) => {
    const inputFileStr = fs.readFileSync(inputFile, 'utf8');
    const expectedOutputFileStr = fs.readFileSync(expectedOutputFile, 'utf8');
    const expectedOutputFileRows = expectedOutputFileStr.split('\n');
    const compressedCols = getColumns(inputFileStr).map(col => compressionAlg(col));
    for (let i = 0; i < compressedCols.length; i++) {
        if (!diffStrings(expectedOutputFileRows[i], compressedCols[i])) {
            console.log("\n" + expectedOutputFile + `: failed to compress column ${i} correctly`);
            return false; 
        }
    }
    console.log(expectedOutputFile + ": passed all columns");
    return true;
}

const testBBC = () => {
    const bbcTestFiles = [
        ['data/animals', 'data/animals_BBC_8'],
        ['data/animals_sorted', 'data/animals_sorted_BBC_8'],
    ];
    console.log("\nTesting BBC...");
    for (const [inputFile, expectedOutputFile] of bbcTestFiles) {
        if (!testCompressionAlg(bbcCompress, inputFile, expectedOutputFile)) 
            return;
    }
}

const testWAH = () => {
    const wahTestFiles = [
        // ['data/animals', 'data/animals_WAH_4', 4],
        ['data/animals', 'data/animals_WAH_8', 8],
        // ['data/animals', 'data/animals_WAH_16', 16],
        // ['data/animals', 'data/animals_WAH_32', 32],
        // ['data/animals', 'data/animals_WAH_64', 64],
        // ['data/animals_sorted', 'data/animals_sorted_WAH_4', 4],
        // ['data/animals_sorted', 'data/animals_sorted_WAH_8', 8],
        // ['data/animals_sorted', 'data/animals_sorted_WAH_16', 16],
        // ['data/animals_sorted', 'data/animals_sorted_WAH_32', 32],
        // ['data/animals_sorted', 'data/animals_sorted_WAH_64', 64],
    ];
    console.log("\nTesting WAH...");
    for (const [inputFile, expectedOutputFile, wordSize] of wahTestFiles) {
        const wahCompression = (index) => 
            bitsToString(wahCompress(index, wordSize).compressed, wordSize);

        if (!testCompressionAlg(wahCompression, inputFile, expectedOutputFile)) 
            return;
    }
}

const testVAL = () => {
    const valTestFiles = [
        ['data/animals', 32, 2],
    ];
    console.log("\nTesting VAL...");
    for (const [inputFile, wordSize, segmentCount] of valTestFiles) {
        for (let col of getColumns(fs.readFileSync(inputFile, 'utf8'))) {
            const compressed = valCompress(col, wordSize, segmentCount);
            const decompressed = valDecompress(compressed, compressed.length, 
                                                wordSize, segmentCount);
        }
    }
}

testBBC();
testWAH();
testVAL();
