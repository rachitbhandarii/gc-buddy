const chatWindow = document.getElementById('chat-window');
const inputForm = document.getElementById('input-area');
const userInput = document.getElementById('user-input');

function addMessage(text, sender = 'bot') {
  const msg = document.createElement('div');
  msg.className = 'message ' + sender;
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function base64ToDecimal(b64) {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const decoded = atob(padded);
  return decoded;
}

async function fetchCourseInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    addMessage('Could not get active tab.', 'bot');
    return;
  }
  const match = tab.url.match(/\/c\/([a-zA-Z0-9\-_]+)/);
  const b64CourseId = match ? match[1] : null;
  if (!b64CourseId) {
    addMessage('Not on a course page. Please open a specific course.', 'bot');
    return;
  }
  let courseId;
  try {
    courseId = base64ToDecimal(b64CourseId);
  } catch (e) {
    addMessage('Failed to decode course ID from URL.', 'bot');
    return;
  }
  addMessage('Using courseId: ' + courseId, 'bot'); // Debug info
  chrome.runtime.sendMessage({ type: 'FETCH_CLASSROOM_COURSE', courseId }, (response) => {
    if (response && response.data) {
      addMessage('Course Info:\n' + JSON.stringify(response.data, null, 2), 'bot');
    } else {
      addMessage(
        'Error: ' +
          (response && typeof response.error === 'object'
            ? JSON.stringify(response.error, null, 2)
            : response && response.error),
        'bot'
      );
    }
  });
}

async function showUserInfo() {
  chrome.runtime.sendMessage({ type: 'GET_USER_INFO' }, (response) => {
    if (response && response.data && response.data.email) {
      addMessage('You are signed in as: ' + response.data.email, 'bot');
    } else {
      addMessage('Could not fetch user info.', 'bot');
    }
  });
}

async function forceReauth() {
  chrome.runtime.sendMessage({ type: 'FORCE_REAUTH' }, (response) => {
    if (response && response.success) {
      addMessage('Authentication cache cleared. Please try your command again.', 'bot');
      showUserInfo();
    } else {
      addMessage('Could not clear authentication cache.', 'bot');
    }
  });
}

function summarizeAnnouncements(data) {
  if (!data.announcements || !data.announcements.length) return 'No announcements found.';
  return data.announcements.map(a => `• ${a.text || a.materials?.map(m=>m.link?.title).join(', ') || '[No text]'} (by ${a.creatorUserId})`).join('\n');
}

function summarizeCoursework(data) {
  if (!data.courseWork || !data.courseWork.length) return 'No coursework found.';
  return data.courseWork.map(cw => `• ${cw.title} (${cw.workType})`).join('\n');
}

// Listen for context messages from content script
if (window.gcBuddyListener) {
  chrome.runtime.onMessage.removeListener(window.gcBuddyListener);
}
window.gcBuddyListener = function (msg, sender, sendResponse) {
  if (msg.type === 'CLASSROOM_CONTEXT') {
    if (!msg.courseId) {
      addMessage('No course ID detected. Please open a course page.', 'bot');
      return;
    }
    if (msg.context === 'announcements') {
      addMessage('You are viewing announcements. Fetching latest...','bot');
      fetchAnnouncements(msg.courseId);
    } else if (msg.context === 'coursework') {
      addMessage('You are viewing coursework. Fetching assignments...','bot');
      fetchCoursework(msg.courseId);
    } else if (msg.context === 'posts') {
      addMessage('You are viewing posts. Fetching stream...','bot');
      fetchPosts(msg.courseId);
    }
  }
  // Handle stream item context result from content script
  if (msg.type === 'STREAM_ITEM_CONTEXT_RESULT') {
    console.log('Sidebar: STREAM_ITEM_CONTEXT_RESULT received', msg);
    if (msg.error) {
      console.log('Sidebar: Displaying error', msg.error);
      addMessage('Error fetching item: ' + msg.error, 'bot');
    } else if (msg.data) {
      console.log('Sidebar: Displaying data', msg.data);
      const label = msg.itemType === 'coursework' ? 'Coursework details' : 'Announcement details';
      addMessage(label + ':\n' + JSON.stringify(msg.data, null, 2), 'bot');
    }
  }
};
chrome.runtime.onMessage.addListener(window.gcBuddyListener);

async function fetchAnnouncements(courseId) {
  chrome.runtime.sendMessage({ type: 'FETCH_CLASSROOM_ANNOUNCEMENTS', courseId }, (response) => {
    if (response && response.data) {
      addMessage(summarizeAnnouncements(response.data), 'bot');
    } else {
      addMessage('Error fetching announcements: ' + (response && typeof response.error === 'object' ? JSON.stringify(response.error, null, 2) : response && response.error), 'bot');
    }
  });
}

async function fetchCoursework(courseId) {
  chrome.runtime.sendMessage({ type: 'FETCH_CLASSROOM_COURSEWORK', courseId }, (response) => {
    if (response && response.data) {
      addMessage(summarizeCoursework(response.data), 'bot');
    } else {
      addMessage('Error fetching coursework: ' + (response && typeof response.error === 'object' ? JSON.stringify(response.error, null, 2) : response && response.error), 'bot');
    }
  });
}

async function fetchPosts(courseId) {
  fetchAnnouncements(courseId);
}

// Manual commands
inputForm.onsubmit = (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  userInput.value = '';

  if (/refresh|update|context/i.test(text)) {
    addMessage('Refreshing context...', 'bot');
    chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT' });
    // The content script will send a new context message
  } else if (/course info|current course|show course/i.test(text)) {
    addMessage('Fetching course info...', 'bot');
    fetchCourseInfo();
  } else if (/who am i|my account|user info/i.test(text)) {
    showUserInfo();
  } else if (/reauth|reset auth|clear auth/i.test(text)) {
    forceReauth();
  } else {
    addMessage("I'm GC Buddy! Type 'refresh' to update, 'course info' for course details, 'who am I' for your account, or just browse Classroom and I'll fetch info for you.", 'bot');
  }
};

// Greetings :)
addMessage("Hi! I'm GC Buddy. Browse your Classroom and I'll fetch info for you. Type 'refresh' to update, 'course info' for course details, or 'who am I' for your account.", 'bot'); 