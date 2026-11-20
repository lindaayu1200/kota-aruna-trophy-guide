// Small shared formatting helpers. Everything here is text-only; no markup is fetched or trusted.
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

export function mini(text, className) {
  return `<span class="mini ${className}">${esc(text)}</span>`;
}

export function gradeBadge(grade, large = false) {
  const cls = large ? 'grade-badge' : 'mini';
  return `<span class="${cls} g-${esc(grade)}">${esc(grade)}</span>`;
}

export function countLabel(value) {
  if (value === null || value === undefined) return '';
  return typeof value === 'number' ? value.toLocaleString('en-US') : String(value);
}

export function showToast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => node.classList.remove('show'), 2200);
}
