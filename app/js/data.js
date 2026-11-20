// Loads the three local data files. All paths are relative to app/index.html.
async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to read ${path}`);
  return response.json();
}

export async function loadAppData() {
  const [trophyDoc, roadmap, collectibles] = await Promise.all([
    readJson('data/trophies.json'),
    readJson('data/roadmap.json'),
    readJson('data/collectibles.json'),
  ]);
  return { trophies: trophyDoc.trophies, roadmap, collectibles };
}
