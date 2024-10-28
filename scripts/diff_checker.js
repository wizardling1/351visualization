document.getElementById('compare-btn').addEventListener('click', function() {
    var text1 = document.getElementById('text1').value;
    var text2 = document.getElementById('text2').value;

    if (text1 === text2) {
        document.getElementById('result').innerHTML = '<div class="alert alert-success">The texts match.</div>';
    } else {
        document.getElementById('result').innerHTML = '<div class="alert alert-danger">The texts do not match.</div>';
    }
});