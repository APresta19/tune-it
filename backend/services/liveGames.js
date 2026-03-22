const liveGames = {};

export const PHASES = {
  LOBBY: "lobby",
  SELECTING: "selecting",
  PLAYING: "playing",
  FINISHED: "finished",
};

export function getOrCreateGame(gameId) {
  if (!liveGames[gameId]) {
    liveGames[gameId] = {
      phase: PHASES.LOBBY,
      songAmountToAdd: 3,
      currentSongIndex: 0,
      currentSong: null,
      currentRound: 0,
      totalRounds: 3,
      players: {},
      correctPlayer: null,
      who_guessed: [],
      scores: {},
      createdAt: Date.now(),
      queue: [], // song queue (should've been more specific)
      savePlaylist: true,
    };
  }
  return liveGames[gameId];
}

export function getCurrentSong(gameId)
{
  const currentSongIndex = liveGames[gameId].currentSongIndex;
  return liveGames[gameId].queue[currentSongIndex];
}

export function getGame(gameId) {
  return liveGames[gameId];
}

export function deleteGame(gameId) {
  delete liveGames[gameId];
}

export function getAllGames()
{
  return liveGames;
}
