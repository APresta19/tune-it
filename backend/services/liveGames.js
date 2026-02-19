const liveGames = {};

export const PHASES = {
  LOBBY: "lobby",
  PLAYING: "playing",
  SCORING: "scoring",
  FINISHED: "finished",
};

export function getOrCreateGame(gameId) {
  if (!liveGames[gameId]) {
    liveGames[gameId] = {
      phase: PHASES.LOBBY,
      songAmountToAdd: 3,
      players: {},
      createdAt: Date.now(),
    };
  }
  return liveGames[gameId];
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
