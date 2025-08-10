(() => {
  const OVERLAY_CLASS = "xt-blocker-overlay";
  const MARKER_ATTR = "data-xt-blocked";
  const CLICKED_ATTR = "data-xt-clicked";

  function createOverlay(videoEl) {
    const overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute("aria-label", "Video is blocked. View video");

    // Center message
    const center = document.createElement("div");
    center.className = "xt-blocker-overlay__center";
    center.textContent = "Video is blocked";
    overlay.appendChild(center);

    // Bottom-right subtle link
    const footer = document.createElement("div");
    footer.className = "xt-blocker-overlay__footer";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "xt-blocker-overlay__reveal";
    button.textContent = "View video";
    footer.appendChild(button);
    overlay.appendChild(footer);

    const reveal = (e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      videoEl.setAttribute(CLICKED_ATTR, "true");
      // Allow the player container to become visible again
      const container = videoEl.closest('[data-testid="videoPlayer"]') || overlay.parentElement;
      if (container && container instanceof HTMLElement) {
        container.classList.add("xt-allow");
      }
      overlay.remove();
      // Reveal the video and attempt to start playback within the same user gesture
      requestAnimationFrame(() => {
        videoEl.style.visibility = "visible";
        try {
          // Many sites use container click handlers to toggle playback
          if (container && container instanceof HTMLElement) {
            container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
            container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
            container.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          }
          videoEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          const p = videoEl.play?.();
          if (p && typeof p.then === "function") {
            p.catch(() => {
              // ignore; user can click the native controls
            });
          }
        } catch (_) {
          // ignore
        }
      });
    };
    overlay.addEventListener("click", (e) => {
      // Only reveal when clicking the explicit control, not the whole overlay
      const target = e.target;
      if (target instanceof Element && target.closest(".xt-blocker-overlay__reveal")) {
        reveal(e);
      }
    });
    button.addEventListener("click", reveal);

    return overlay;
  }

  function ensurePositionedContainer(el) {
    const parent = el.parentElement;
    if (!parent) return null;
    const style = getComputedStyle(parent);
    if (style.position === "static") {
      parent.style.position = "relative";
    }
    return parent;
  }

  function hideVideoWithOverlay(videoEl) {
    if (!videoEl || videoEl.getAttribute(MARKER_ATTR) === "true") return;

    let container = videoEl.closest('[data-testid="videoPlayer"]');
    if (!(container instanceof HTMLElement)) {
      container = ensurePositionedContainer(videoEl) || videoEl.parentElement;
    }
    if (!container) return;

    const cs = getComputedStyle(container);
    if (cs.position === "static") container.style.position = "relative";

    // Hide the video but keep layout. CSS also hides at document_start; ensure it here as well.
    videoEl.style.visibility = "hidden";
    container.classList.remove("xt-allow");

    const overlay = createOverlay(videoEl);
    container.appendChild(overlay);
    videoEl.setAttribute(MARKER_ATTR, "true");
  }

  function isTwitterVideo(el) {
    if (!(el instanceof HTMLVideoElement)) return false;
    // Exclude non-feed or non-visible videos if needed later.
    return true;
  }

  function processExistingVideos() {
    const videos = document.querySelectorAll("video");
    for (const v of videos) {
      if (!isTwitterVideo(v)) continue;
      if (v.getAttribute(CLICKED_ATTR) === "true") continue;
      hideVideoWithOverlay(v);
    }
  }

  // Observe dynamically added videos and containers in the feed
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const added = m.addedNodes;
      for (const node of added) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node instanceof HTMLVideoElement) {
          if (node.getAttribute(CLICKED_ATTR) !== "true") hideVideoWithOverlay(node);
        } else {
          // If a container is added before the <video>, pre-place an overlay to prevent any flashes
          if (node instanceof HTMLElement && node.matches('[data-testid="videoPlayer"]')) {
            const placeholderVideo = node.querySelector('video');
            if (placeholderVideo) {
              hideVideoWithOverlay(placeholderVideo);
            }
          }
          const vids = node.querySelectorAll?.("video");
          vids?.forEach((v) => {
            if (v.getAttribute(CLICKED_ATTR) !== "true") hideVideoWithOverlay(v);
          });
        }
      }
    }
  });

  function start() {
    processExistingVideos();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


