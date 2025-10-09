// Common JavaScript for all pages
// Fix viewport height in PWA

function fixViewportHeight() {
    // Calculate the actual viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Fix viewport height on load
fixViewportHeight();

// Fix viewport height on resize
window.addEventListener('resize', fixViewportHeight);

// Fix viewport height on orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(fixViewportHeight, 100);
});

// Fix viewport height when page is shown (including bfcache)
window.addEventListener('pageshow', (event) => {
    fixViewportHeight();
});
