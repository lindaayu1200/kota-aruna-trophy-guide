// Centre-pane trophy page: official text, cited original guidance and links to related trophies.
import { esc, mini, gradeBadge, countLabel } from './util.js';
import { isMasked, visibleName, visibleDescription } from './spoiler.js';

function relatedTo(trophy, all, limit = 6) {
  const sameStage = all.filter((t) => t.id !== trophy.id && t.roadmap_stage === trophy.roadmap_stage);
  const sameKind = all.filter((t) => t.id !== trophy.id && t.kind === trophy.kind && !sameStage.includes(t));
  return [...sameStage, ...sameKind].slice(0, limit);
}

function lockedPage(trophy) {
  return `<div class="locked">
    <div class="q">???</div>
    <h2>??? — hidden story trophy</h2>
    <p>Spoiler mode is on. Tick this trophy as earned to reveal its official name, description and guide.</p>
    <div class="meta" style="justify-content:center">${mini(`Stage: ${trophy.roadmap_stage}`, 'm-time')}${mini('HIDDEN UNTIL EARNED', 'm-hidden')}</div>
  </div>`;
}

export function renderDetail(host, trophy, options) {
  const { all, earned, spoilerOn, onOpen } = options;
  if (!trophy) {
    host.innerHTML = '<div class="empty">Choose a trophy from the checklist to read its guide.</div>';
    return;
  }
  if (isMasked(trophy, earned, spoilerOn)) {
    host.innerHTML = lockedPage(trophy);
    return;
  }

  const meta = [
    mini(`Difficulty ${trophy.difficulty}/10`, 'm-diff'),
    mini(`Est. ${trophy.est_time}`, 'm-time'),
    mini(`Missable: ${trophy.missable ? 'yes' : 'no'}`, trophy.missable ? 'm-miss' : 'm-time'),
    mini(`Stage: ${trophy.roadmap_stage}`, 'm-time'),
    trophy.hidden ? mini('Hidden until earned', 'm-hidden') : '',
    trophy.count !== null && trophy.count !== undefined ? mini(`Count: ${countLabel(trophy.count)}`, 'm-time') : '',
  ].filter(Boolean).join('');

  const steps = trophy.steps.map((step) =>
    `<li>${esc(step.text)}<span class="cite">[${esc(step.source)}]</span></li>`).join('');

  const sources = trophy.sources.map((source) =>
    `<li><b>${esc(source.name)}</b> — ${esc(source.author)} <span>· ${esc(source.url)}</span></li>`).join('');

  const related = relatedTo(trophy, all).map((other) =>
    `<button class="rel-btn" type="button" data-open="${esc(other.name)}">${esc(visibleName(other, earned, spoilerOn))}</button>`).join('');

  host.innerHTML = `
    <div class="detail-top">
      <div class="crumb">${esc(trophy.chapter)} · ${esc(trophy.mission)} · trophy ${trophy.id} of 55</div>
      <div class="detail-title">${gradeBadge(trophy.grade, true)}<h2>${esc(visibleName(trophy, earned, spoilerOn))}</h2></div>
      <blockquote class="official">“${esc(visibleDescription(trophy, earned, spoilerOn))}”</blockquote>
      <div class="meta">${meta}</div>
    </div>
    ${trophy.missable ? `<div class="warning"><b>MISSABLE — READ BEFORE YOU MOVE ON</b><p>${esc(trophy.missable_note)}</p></div>` : ''}
    <section class="section">
      <h3>How to earn</h3>
      <p class="overview">${esc(trophy.guide)}</p>
      <ol class="steps">${steps}</ol>
    </section>
    <section class="section">
      <h3>Sources</h3>
      <ul class="sources">${sources}</ul>
    </section>
    <section class="section">
      <h3>Related trophies</h3>
      <div class="related">${related}</div>
    </section>`;

  for (const button of host.querySelectorAll('[data-open]')) {
    button.addEventListener('click', () => onOpen(button.dataset.open));
  }
}
