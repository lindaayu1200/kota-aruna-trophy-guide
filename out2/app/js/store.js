// Progress persistence: localStorage, JSON export and JSON import. No network calls.
const PROGRESS_KEY = 'aruna-ledger.progress.v1';
const SPOILER_KEY = 'aruna-ledger.spoiler.v1';

export function loadEarned() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveEarned(names) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...names]));
}

export function toggleName(names, name) {
  const next = new Set(names);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  return next;
}

export function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === 'on';
}

export function saveSpoiler(enabled) {
  localStorage.setItem(SPOILER_KEY, enabled ? 'on' : 'off');
}

export function exportProgress(names) {
  const payload = {
    app: 'ARUNA Trophy Ledger',
    game: 'Grand Theft Auto VI',
    platform: 'PlayStation 5',
    earned: [...names].sort(),
    exported: new Date().toISOString(),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aruna-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importProgress(file, knownNames) {
  const parsed = JSON.parse(await file.text());
  const raw = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(raw)) throw new Error('The file has no earned list.');
  const allowed = new Set(knownNames);
  return new Set(raw.filter((name) => allowed.has(name)));
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}
