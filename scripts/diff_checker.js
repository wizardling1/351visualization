document.getElementById('compare-btn').addEventListener('click', function() {
    var text1 = document.getElementById('text1').value;
    var text2 = document.getElementById('text2').value;

    var diff = Diff.diffWordsWithSpace(text1, text2); // This one is to diff complete words 
    // var diff = Diff.diffChars(text1, text2); // this cone can be used to character diffs

    var display1 = document.createElement('div');
    display1.classList.add('diff-container');

    var display2 = document.createElement('div');
    display2.classList.add('diff-container');

    diff.forEach(function(part){
        var span1 = document.createElement('span');
        var span2 = document.createElement('span');

        if (part.added) {
            // Text added in text2
            span1.appendChild(document.createTextNode('')); // Placeholder for alignment
            span2.classList.add('added');
            span2.appendChild(document.createTextNode(part.value));
        } else if (part.removed) {
            // Text removed from text1
            span1.classList.add('removed');
            span1.appendChild(document.createTextNode(part.value));
            span2.appendChild(document.createTextNode('')); // Placeholder for alignment
        } else {
            // Matching text
            span1.appendChild(document.createTextNode(part.value));
            span2.appendChild(document.createTextNode(part.value));
        }

        display1.appendChild(span1);
        display2.appendChild(span2);
    });

    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    // Create a container to hold both displays side by side
    var container = document.createElement('div');
    container.classList.add('comparison-container');

    // Add labels or headings if desired
    var header1 = document.createElement('h3');
    header1.textContent = 'Your input';
    var header2 = document.createElement('h3');
    header2.textContent = 'Correct output';

    display1.prepend(header1);
    display2.prepend(header2);

    container.appendChild(display1);
    container.appendChild(display2);

    resultDiv.appendChild(container);
});