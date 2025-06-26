function base64ToDecimal(b64) {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const decoded = atob(padded);
  return decoded;
}

function getCourseIdFromUrl() {
  const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9\-_]+)/);
  if (!match) return null;
  return base64ToDecimal(match[1]);
}

function addButtonToStreamItem(item) {

  const isQhnNic = item.classList.contains('qhnNic');
  const isLi = item.tagName === 'LI' && item.hasAttribute('data-stream-item-id');
  if (!isQhnNic && !isLi) return;
  if (item.querySelector('.gc-buddy-add-btn')) return;

  let itemType = 'announcement';
  if (isQhnNic && (item.classList.contains('DkDwHe') || item.querySelector('.DkDwHe'))) {
    itemType = 'coursework';
  }
  if (isLi) {
    itemType = 'coursework';
  }

  let container = item;
  if (isQhnNic) {
    const nmpzvc = item.querySelector('.Nmpzvc');
    if (!nmpzvc) return;
    container = nmpzvc;
  }

  const btn = document.createElement('button');
  btn.textContent = 'Add to Context';
  btn.className = 'gc-buddy-add-btn';
  btn.style.float = 'right';
  btn.style.marginLeft = '8px';
  btn.style.marginRight = '0';
  btn.style.padding = '2px 8px';
  btn.style.fontSize = '12px';
  btn.style.background = '#20A464';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.cursor = 'pointer';
  btn.onclick = (e) => {
    e.stopPropagation();

    let el = item;
    while (el && el !== document.body) {
      if (el.hasAttribute && el.hasAttribute('data-stream-item-id')) {
        const itemId = el.getAttribute('data-stream-item-id');
        const courseId = getCourseIdFromUrl();
        console.log('Button clicked - itemId:', itemId, 'courseId:', courseId, 'itemType:', itemType);
        chrome.runtime.sendMessage({
          type: 'FETCH_STREAM_ITEM_CONTEXT',
          itemId,
          courseId,
          itemType
        });
        console.log('Message sent to background script');
        break;
      }
      el = el.parentElement;
    }
    btn.textContent = 'Added!';
    btn.disabled = true;
    btn.style.background = '#F5BA14';
  };
  container.appendChild(btn);
}

function injectQhnNicButtons() {
  document.querySelectorAll('.qhnNic').forEach(addButtonToStreamItem);
  document.querySelectorAll('li[data-stream-item-id]').forEach(addButtonToStreamItem);
}

const observer = new MutationObserver(() => {
  injectQhnNicButtons();
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('DOMContentLoaded', injectQhnNicButtons);
window.addEventListener('popstate', injectQhnNicButtons);
window.addEventListener('hashchange', injectQhnNicButtons); 