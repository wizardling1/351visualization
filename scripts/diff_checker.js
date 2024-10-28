document.getElementById('compare-btn').addEventListener('click', function() {
    var text1 = document.getElementById('text1').value;
    var text2 = document.getElementById('text2').value;

    var diff = Diff.diffChars(text1, text2);

    var display = document.createElement('div');
    display.classList.add('diff-container');

    diff.forEach(function(part){
        var span = document.createElement('span');

        if (part.added) {
            span.classList.add('added');
            span.appendChild(document.createTextNode(part.value));
        } else if (part.removed) {
            span.classList.add('removed');
            span.appendChild(document.createTextNode(part.value));
        } else {
            span.appendChild(document.createTextNode(part.value));
        }

        display.appendChild(span);
    });

    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';
    resultDiv.appendChild(display);
});