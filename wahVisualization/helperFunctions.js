function simplifyString(runType, litSize) {
    const halfSize = Math.floor(litSize / 2);
    const start = Math.floor((litSize - halfSize) / 2);
    const end = start + halfSize;
    
    return (
        runType.repeat(start) + 
        '.'.repeat(halfSize) + 
        runType.repeat(litSize - end)
    );
}

 // this function takes decimal and size
        // gives back a binary representation filled with 0's on the left so we always have a result of size
function decimalToBinary(decimal, size) {
    // Convert the decimal number to a binary string
    let binaryString = decimal.toString(2);
    // Pad the binary string with leading 0's to match the  size
    while (binaryString.length < size) {
        binaryString = '0' + binaryString;
    }
    // If the binary string exceeds the word , trim it to fit
    if (binaryString.length > size) {
        binaryString = binaryString.slice(-size);
    }

    return binaryString;
}