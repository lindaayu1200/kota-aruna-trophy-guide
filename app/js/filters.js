// Filter chips and matching. Each chip is a single active filter; the stage filter comes from the roadmap.
export const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'done', label: 'Done' },
  { id: 'todo', label: 'Todo' },
];

export function renderFilterChips(host, active, onSelect) {
  host.replaceChildren();
  for (const chip of FILTER_CHIPS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip-btn' + (active === chip.id ? ' is-active' : '');
    button.textContent = chip.label;
    button.dataset.filter = chip.id;
    button.addEventListener('click', () => onSelect(chip.id));
    host.append(button);
  }
}

function matchesKind(trophy, filter) {
  if (filter === 'all') return true;
  if (filter === 'missable') return trophy.missable;
  if (filter === 'hidden') return trophy.hidden;
  if (filter === 'done' || filter === 'todo') return null;
  return trophy.kind === filter;
}

export function applyFilters(trophies, state, earned, visibleNameFor) {
  return trophies.filter((trophy) => {
    if (state.stage && trophy.roadmap_stage !== state.stage) return false;
    const kindMatch = matchesKind(trophy, state.filter);
    if (kindMatch === false) return false;
    const isEarned = earned.has(trophy.name);
    if (state.filter === 'done' && !isEarned) return false;
    if (state.filter === 'todo' && isEarned) return false;
    const query = state.search.trim().toLowerCase();
    if (!query) return true;
    const haystack = `${visibleNameFor(trophy, earned, state.spoilerOn)} ${trophy.mission} ${trophy.roadmap_stage} ${trophy.chapter}`.toLowerCase();
    return haystack.includes(query);
  });
}
