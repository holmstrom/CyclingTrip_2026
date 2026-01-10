// Global Error Handler for Debugging
window.onerror = function(msg, url, lineNo, columnNo, error) {
    const errorBox = document.createElement('div');
    errorBox.style.position = 'fixed';
    errorBox.style.top = '10px';
    errorBox.style.left = '10px';
    errorBox.style.background = 'rgba(255, 0, 0, 0.9)';
    errorBox.style.color = 'white';
    errorBox.style.padding = '20px';
    errorBox.style.zIndex = '9999';
    errorBox.style.borderRadius = '8px';
    errorBox.style.fontFamily = 'monospace';
    errorBox.innerHTML = `<strong>JavaScript Error:</strong><br>${msg}<br>Line: ${lineNo}<br>${error ? error.stack : ''}`;
    document.body.appendChild(errorBox);
    return false;
};

// ... existing code ...
document.addEventListener('DOMContentLoaded', () => {
    // ...
});

