function createViewHiddenButton(tweetElement) {
  if (tweetElement.querySelector('.view-hidden-btn')) {
    return;
  }

  const hiddenContent = tweetElement.querySelector('div.css-175oi2r.r-9aw3ui');
  if (!hiddenContent) {
    return;
  }

  const viewButton = document.createElement('button');
  viewButton.className = 'view-hidden-btn';
  viewButton.setAttribute('aria-label', 'View hidden content in this tweet');
  
  const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgIcon.setAttribute('viewBox', '0 0 24 24');
  svgIcon.setAttribute('aria-hidden', 'true');
  svgIcon.classList.add('r-4qtqp9', 'r-yyyyoo', 'r-dnmrzs', 'r-bnwqim', 'r-lrvibr', 'r-m6rgpd', 'r-1xvli5t', 'r-1hdv0qi');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
  svgIcon.appendChild(path);
  viewButton.appendChild(svgIcon);
  
  viewButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTweetHiddenContent(tweetElement);
  });
  
  const topActionButtons = tweetElement.querySelector('div.css-175oi2r.r-1awozwy.r-18u37iz.r-1cmwbt1.r-1wtj0ep');
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
  const hiddenContent = tweetElement.querySelector('div.css-175oi2r.r-9aw3ui');
  
  if (!hiddenContent || !viewButton) return;
  
  const isCurrentlyVisible = hiddenContent.classList.contains('show-hidden');
  
  if (isCurrentlyVisible) {
    hiddenContent.classList.remove('show-hidden');
    viewButton.classList.remove('content-visible');
    
    const svgIcon = viewButton.querySelector('svg');
    if (svgIcon) {
      const path = svgIcon.querySelector('path');
      if (path) {
        path.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
      }
    }
    
    hiddenContent.style.setProperty('display', 'none', 'important');
  } else {
    hiddenContent.style.setProperty('display', 'block', 'important');
    hiddenContent.classList.add('show-hidden');
    viewButton.classList.add('content-visible');
    
    const svgIcon = viewButton.querySelector('svg');
    if (svgIcon) {
      const path = svgIcon.querySelector('path');
      if (path) {
        path.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
      }
    }
  }
}

function isQuoteTweet(tweetElement) {
  const allTextElements = tweetElement.querySelectorAll('div[dir="ltr"], span');
  for (const element of allTextElements) {
    if (element.textContent && element.textContent.trim() === 'Quote') {
      return true;
    }
  }
  
  const quoteIndicator = tweetElement.querySelector('[data-testid="quoteTweet"]');
  if (quoteIndicator) {
    return true;
  }
  
  const nestedTweet = tweetElement.querySelector('[data-testid="tweet"]');
  if (nestedTweet && tweetElement !== nestedTweet) {
    return true;
  }
  
  return false;
}

function hasMedia(tweetElement) {
  const images = tweetElement.querySelectorAll('img[alt*="Image"], img[data-testid="tweetPhoto"]');
  if (images.length > 0) {
    return true;
  }
  
  const videos = tweetElement.querySelectorAll('video, [data-testid="videoPlayer"]');
  if (videos.length > 0) {
    return true;
  }
  
  const mediaContainers = tweetElement.querySelectorAll('[data-testid="tweetPhoto"], [data-testid="videoPlayer"], .css-175oi2r.r-1adg3ll.r-1ny4l3l');
  if (mediaContainers.length > 0) {
    return true;
  }
  
  return false;
}

function processAllTweets() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');

  tweets.forEach(tweet => {
    const hiddenContent = tweet.querySelector('div.css-175oi2r.r-9aw3ui');
    if (hiddenContent && !hiddenContent.classList.contains('show-hidden')) {
      if (isQuoteTweet(tweet)) {
        if (hasMedia(tweet)) {
          hiddenContent.style.setProperty('display', 'none', 'important');
        }
      } else {
        hiddenContent.style.setProperty('display', 'none', 'important');
      }
    }
  });

  tweets.forEach(tweet => {
    createViewHiddenButton(tweet);
  });
}

function init() {
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
              if (node.querySelector && node.querySelector('[data-testid="tweet"]')) {
                shouldProcess = true;
              }
              if (node.matches && node.matches('[data-testid="tweet"]')) {
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
