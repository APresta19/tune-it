
let hostTokens = {};

export default function getOrCreateToken(gameId, access_token)
{
    if (!hostTokens[gameId] || access_token)
    {
        hostTokens[gameId] = { access_token };
    }
    return hostTokens[gameId];
}