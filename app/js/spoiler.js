// Spoiler rules: when spoilers are on, unearned story trophies show no name and no description.
export function isMasked(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

export function visibleName(trophy, earned, spoilerOn) {
  return isMasked(trophy, earned, spoilerOn) ? '??? — hidden story trophy' : trophy.name;
}

export function visibleDescription(trophy, earned, spoilerOn) {
  return isMasked(trophy, earned, spoilerOn) ? 'Hidden until this story trophy is earned.' : trophy.description;
}
