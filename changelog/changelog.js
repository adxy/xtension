document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const version = urlParams.get('version');

    // No hardcoded fallback -- the version comes from the manifest or not at all,
    // so the page can never advertise a stale one.
    if (version) {
        document.getElementById('version-badge').textContent = 'v' + version;
        document.getElementById('version-dot').hidden = false;
    }

    // Anything other than a first install falls through to the release notes,
    // which is also what a bare URL with no type shows.
    if (type !== 'install') {
        return;
    }

    document.getElementById('version-title').textContent = 'Welcome';
    document.getElementById('major-update-note').textContent = 'Media is hidden from now on.';
    document.getElementById('cta').textContent = 'Try it on X';
    document.getElementById('changes-update').hidden = true;
    document.getElementById('changes-install').hidden = false;
});
