const template = `
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
        <a class="navbar-brand" href="#">Bitmap Compression Visualizer</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
           aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
           <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                    <a class="nav-link" href="home.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="animation.html">Animation</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="diff_checker.html">Diff Checker</a>
                </li>
            </ul>
        </div>
    </div>
</nav>
`

class NavBar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = template;
        this.setActiveLink();
    }

    setActiveLink() {
        const activeLink = this.getAttribute('active-link');
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            if (link.getAttribute('href') == activeLink) {
                console.log(link.parentElement);
                link.parentElement.classList.add('active');
            }
        })
    }
}

customElements.define("nav-bar", NavBar)
