
let hostTokens = {};

export default function getOrCreateToken(gameId, access_token)
{
    if (!hostTokens[gameId])
    {
        hostTokens[gameId] = {
            access_token
        }
    }
    return hostTokens[gameId];
}