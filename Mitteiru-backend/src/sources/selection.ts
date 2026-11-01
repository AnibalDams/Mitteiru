import type { SourceEpisode } from "./types";

/**
 * Filtra y ordena episodios según la selección del usuario.
 * Se mantiene puro para poder probarlo sin base de datos ni red.
 */
export function selectEpisodes(
  episodes: SourceEpisode[],
  requestedNumbers?: number[],
): { selected: SourceEpisode[]; skipped: number } {
  // `undefined` significa "todos"; un array vacío significa "ninguno".
  if (requestedNumbers === undefined) {
    return { selected: episodes, skipped: 0 };
  }
  if (requestedNumbers.length === 0) {
    return { selected: [], skipped: 0 };
  }

  const wanted = new Set(requestedNumbers);
  const selected = episodes.filter((episode) => wanted.has(episode.number));
  return { selected, skipped: Math.max(0, requestedNumbers.length - selected.length) };
}
