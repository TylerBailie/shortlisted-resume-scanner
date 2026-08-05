const ICONS = {
  success: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#22c55e"/>
    <path d="M6 10.5L8.5 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`,

  error: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#ef4444"/>
    <path d="M7 7L13 13M13 7L7 13" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  pending: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#9ca3af"/>
  </svg>`
};

function setStatusIcon(elementId, state) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = ICONS[state] || ICONS.pending;
}

export { setStatusIcon };