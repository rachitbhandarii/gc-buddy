// Handles authentication and API requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_CLASSROOM_DATA') {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch('https://classroom.googleapis.com/v1/courses', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    });
    return true; // Keep the message channel open for async response
  }
  if (request.type === 'FETCH_CLASSROOM_COURSE' && request.courseId) {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch(`https://classroom.googleapis.com/v1/courses/${request.courseId}/announcements`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    });
    return true;
  }
  if (request.type === 'GET_USER_INFO') {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    });
    return true;
  }
  if (request.type === 'FORCE_REAUTH') {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      chrome.identity.removeCachedAuthToken({ token: token }, function() {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  if (request.type === 'FETCH_CLASSROOM_ANNOUNCEMENTS' && request.courseId) {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch(`https://classroom.googleapis.com/v1/courses/${request.courseId}/announcements`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    });
    return true;
  }
  if (request.type === 'FETCH_CLASSROOM_COURSEWORK' && request.courseId) {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch(`https://classroom.googleapis.com/v1/courses/${request.courseId}/courseWork`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    });
    return true;
  }
  if (request.type === 'SHOW_STREAM_ITEM_CONTEXT' && request.courseId && request.itemId) {
    const itemType = request.itemType || 'announcement';
    let url;
    if (itemType === 'coursework') {
      url = `https://classroom.googleapis.com/v1/courses/${request.courseId}/courseWork/${request.itemId}`;
    } else {
      url = `https://classroom.googleapis.com/v1/courses/${request.courseId}/announcements/${request.itemId}`;
    }
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    });
    return true;
  }
  if (request.type === 'FETCH_STREAM_ITEM_CONTEXT' && request.courseId && request.itemId) {
    console.log('Background: FETCH_STREAM_ITEM_CONTEXT received', request);
    const itemType = request.itemType || 'announcement';
    let url;
    if (itemType === 'coursework') {
      url = `https://classroom.googleapis.com/v1/courses/${request.courseId}/courseWork/${request.itemId}`;
    } else {
      url = `https://classroom.googleapis.com/v1/courses/${request.courseId}/announcements/${request.itemId}`;
    }
    console.log('Background: Making API call to', url);
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        console.log('Background: Auth error', chrome.runtime.lastError);
        chrome.runtime.sendMessage({
          type: 'STREAM_ITEM_CONTEXT_RESULT',
          error: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No auth token',
          itemType
        });
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => {
          console.log('Background: API response received', data);
          chrome.runtime.sendMessage({
            type: 'STREAM_ITEM_CONTEXT_RESULT',
            data,
            itemType
          });
          sendResponse({ data });
        })
        .catch(error => {
          console.log('Background: API error', error);
          chrome.runtime.sendMessage({
            type: 'STREAM_ITEM_CONTEXT_RESULT',
            error: error.toString(),
            itemType
          });
          sendResponse({ error });
        });
    });
    return true;
  }
});

// Defensive check for chrome.action and chrome.sidePanel
if (chrome.action && chrome.action.onClicked && chrome.sidePanel && chrome.sidePanel.open) {
  chrome.action.onClicked.addListener(async (tab) => {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  });
} 