import { io } from "socket.io-client"

let socket;

export function getSocket()
{
    if(!socket)
    {
        socket = io(import.meta.env.VITE_API_URL, {
            transports: ['websocket'],
        })
    }
    return socket;
}