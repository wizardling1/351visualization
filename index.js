// Basic interactivity for UI elements
document.getElementById('compression-method').addEventListener('change', function() {
    const wordSizeContainer = document.getElementById('word-size-container');
    if (this.value === 'wah' || this.value === 'val') {
        wordSizeContainer.classList.remove('hidden');
    } else {
        wordSizeContainer.classList.add('hidden');
    }
});

document.getElementById('diff-checker-btn').addEventListener('click', function() {
    const diffCheckerInput = document.getElementById('diff-checker-input');
    diffCheckerInput.classList.toggle('hidden');
});