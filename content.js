const MEDIA_SELECTOR = [
  '[data-testid="tweetPhoto"]',
  '[data-testid="videoPlayer"]',
  '[data-testid="videoComponent"]',
  '[data-testid="previewInterstitial"]'
].join(',');

// Articles are long-form reads, not media posts: their cover image and inline
// images must stay visible. Matched by test id and by link target (/i/article/ID,
// /user/article/ID), since the href is the part X is least likely to rename.
const ARTICLE_SELECTOR = [
  '[data-testid^="article"]',
  '[data-testid*="twitterArticle"]',
  'a[href*="/article/"]'
].join(',');

function isArticlePage() {
  return /\/article\//.test(location.pathname);
}

// Nodes worth reprocessing for: new posts, media lazy-loaded into posts already
// on screen, and the caret -- whose late arrival is what anchors our button.
const WATCHED_SELECTOR = [
  '[data-testid="tweet"]',
  '[data-testid="caret"]',
  MEDIA_SELECTOR
].join(',');

const EYE_OPEN_PATH ='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const EYE_CLOSED_PATH = 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z';

// Only the major.minor part is compared, so patch releases (2.0.1 -> 2.0.2) ship
// quietly and the changelog stays reserved for feature updates, as it claims.
// Normalising the stored value too keeps existing "2.0.0" entries from firing.
function releaseOf(version) {
  return String(version || '').split('.').slice(0, 2).join('.');
}

function showChangelogIfNeeded() {
  const currentVersion = chrome.runtime.getManifest().version;
  const currentRelease = releaseOf(currentVersion);
  const storedVersion = localStorage.getItem('xtension_last_version');

  if (releaseOf(storedVersion) !== currentRelease) {
    const isFirstTime = !storedVersion;
    const type = isFirstTime ? 'install' : 'update';

    const changelogUrl = chrome.runtime.getURL('changelog/changelog.html?type=' + type + '&version=' + currentVersion);
    const newTab = window.open(changelogUrl, '_blank');

    if (newTab) {
      localStorage.setItem('xtension_last_version', currentVersion);
      newTab.focus();
    }
  }
}

// X regenerates its atomic class names (css-*, r-*) on every build, so the media
// container is located structurally instead: walk up from each media node for as
// long as the ancestor still contains no tweet text. That yields the largest
// block that is purely media, which is exactly what we want to hide.
function findMediaBlocks(tweetElement) {
  const blocks = new Set();

  if (isArticlePage()) return [];

  tweetElement.querySelectorAll(MEDIA_SELECTOR).forEach((media) => {
    if (media.closest(ARTICLE_SELECTOR)) return;

    let node = media;
    let block = media;

    while (node && node !== tweetElement) {
      if (node.querySelector('[data-testid="tweetText"]')) {
        break;
      }
      block = node;
      node = node.parentElement;
    }

    blocks.add(block);
  });

  const all = [...blocks];
  return all.filter((block) => !all.some((other) => other !== block && other.contains(block)));
}

// The tweet header's action cluster (Grok, the "more" caret) is the only ancestor
// of the caret laid out as a flex row with a real column-gap -- every wrapper below
// it uses the default "normal". Keying off that instead of class names both survives
// X's build hashes and lets the row's own 8px gap space our button for free.
function findActionRow(tweetElement) {
  const caret = tweetElement.querySelector('[data-testid="caret"]');
  if (!caret) return null;

  let node = caret.parentElement;
  while (node && node !== tweetElement) {
    const style = getComputedStyle(node);
    if (style.display === 'flex' && style.columnGap && style.columnGap !== 'normal') {
      return node;
    }
    node = node.parentElement;
  }

  return caret.parentElement;
}

function setMediaHidden(tweetElement, hidden) {
  findMediaBlocks(tweetElement).forEach((block) => {
    block.style.setProperty('display', hidden ? 'none' : 'block', 'important');
    block.classList.toggle('show-hidden', !hidden);
  });
}

function createViewHiddenButton(tweetElement) {
  const existingButton = tweetElement.querySelector('.view-hidden-btn');

  if (existingButton) {
    // X paints the post body before hydrating its header, so on a cold
    // navigation the action row can arrive after we've already placed the
    // button in the fallback slot. Promote it once the real anchor exists.
    const row = findActionRow(tweetElement);
    if (row && existingButton.parentElement !== row) {
      row.insertAdjacentElement('afterbegin', existingButton);
    }
    return;
  }

  if (findMediaBlocks(tweetElement).length === 0) {
    return;
  }

  const viewButton = document.createElement('button');
  viewButton.className = 'view-hidden-btn';
  viewButton.setAttribute('aria-label', 'View hidden content in this tweet');

  const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgIcon.setAttribute('viewBox', '0 0 24 24');
  svgIcon.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', EYE_OPEN_PATH);
  svgIcon.appendChild(path);
  viewButton.appendChild(svgIcon);

  viewButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTweetHiddenContent(tweetElement);
  });

  const topActionButtons = findActionRow(tweetElement);

  if (topActionButtons) {
    topActionButtons.insertAdjacentElement('afterbegin', viewButton);
  } else {
    const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
    if (tweetText && tweetText.parentElement) {
      tweetText.parentElement.insertAdjacentElement('afterend', viewButton);
    } else {
      tweetElement.insertAdjacentElement('afterbegin', viewButton);
    }
  }
}

function toggleTweetHiddenContent(tweetElement) {
  const viewButton = tweetElement.querySelector('.view-hidden-btn');
  const blocks = findMediaBlocks(tweetElement);

  if (blocks.length === 0 || !viewButton) return;

  const isCurrentlyVisible = blocks.some((block) => block.classList.contains('show-hidden'));

  setMediaHidden(tweetElement, isCurrentlyVisible);
  viewButton.classList.toggle('content-visible', !isCurrentlyVisible);

  const path = viewButton.querySelector('svg path');
  if (path) {
    path.setAttribute('d', isCurrentlyVisible ? EYE_OPEN_PATH : EYE_CLOSED_PATH);
  }
}

function processAllTweets() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    const alreadyRevealed = tweet.querySelector('.view-hidden-btn.content-visible');
    if (!alreadyRevealed) {
      setMediaHidden(tweet, true);
    }
    createViewHiddenButton(tweet);
  });
}

function init() {
  showChangelogIfNeeded();

  processAllTweets();

  setTimeout(processAllTweets, 1000);
  setTimeout(processAllTweets, 3000);

  try {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches(WATCHED_SELECTOR)) {
                shouldProcess = true;
              }
              if (node.querySelector && node.querySelector(WATCHED_SELECTOR)) {
                shouldProcess = true;
              }
            }
          });
        }
      });

      if (shouldProcess) {
        setTimeout(processAllTweets, 10);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.error('Error setting up mutation observer:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('load', init);
