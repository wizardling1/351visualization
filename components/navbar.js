const template = `
<nav class="navbar navbar-expand-lg navbar-light mb-3" id="fancy">
    <div class="container-fluid">
        <a class="navbar-brand" href="#">Bitmap Compression Visualizer</a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
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
            <!-- Dark Mode Toggle Button -->
            <button id="dark-mode-toggle" class="btn btn-outline-dark ms-3">Toggle Dark Mode</button>
        </div>
    </div>
</nav>
`

class NavBar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = template;
        this.setActiveLink();
        this.setupDarkModeToggle();
    }

    setActiveLink() {
        const activeLink = this.getAttribute('active-link');
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            if (link.getAttribute('href') == activeLink) {
                link.classList.add('active');
            }
        })
    }

    setupDarkModeToggle() {
        const toggleButton = this.querySelector('#dark-mode-toggle'); // Use `this.querySelector` to ensure the button is within the component
        const body = document.body;
        const navbar = document.getElementById('fancy');
        
        const theme = localStorage.getItem('theme');
        if (theme != null && theme == 'dark') {
            localStorage.setItem('theme', 'dark');
            navbar.classList.remove('navbar-light');
            navbar.classList.add('navbar-dark');
            toggleButton.classList.remove('btn-outline-dark');
            toggleButton.classList.add('btn-outline-light');
        }
        else {
            localStorage.setItem('theme', 'light');
            navbar.classList.remove('navbar-dark');
            navbar.classList.add('navbar-light');
            toggleButton.classList.remove('btn-outline-light');
            toggleButton.classList.add('btn-outline-dark');
        }

        toggleButton.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            // Save the user's preference in localStorage
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                navbar.classList.remove('navbar-light');
                navbar.classList.add('navbar-dark');
                toggleButton.classList.remove('btn-outline-dark');
                toggleButton.classList.add('btn-outline-light');
            } else {
                localStorage.setItem('theme', 'light');
                navbar.classList.remove('navbar-dark');
                navbar.classList.add('navbar-light');
                toggleButton.classList.remove('btn-outline-light');
                toggleButton.classList.add('btn-outline-dark');
            }
        });

        // Load the user's preference on page load
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
        }
    }
}

customElements.define("nav-bar", NavBar)
