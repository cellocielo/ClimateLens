

fetch('template.html')
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const templateNode = doc.getElementById('nav-bar-template');

        if (templateNode) {
            document.body.prepend(templateNode.content.cloneNode(true));
        }
    })