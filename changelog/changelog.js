document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const version = urlParams.get('version');
    
    if (version) {
        document.getElementById('version-badge').textContent = 'v' + version;
    }
    
    if (type === 'install') {
        document.getElementById('version-title').textContent = 'Welcome!';
        document.getElementById('major-update-note').textContent = '✨ Thanks for installing our extension!';
    } else if (type === 'update') {
        document.getElementById('version-title').textContent = 'Major Update';
        document.getElementById('major-update-note').textContent = '✨ We only show changelogs for major updates';
    }
});
