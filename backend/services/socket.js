import { io } from "socket.io-client"

let socket;

export function getSocket()
{
    if(!socket)
    {
        const socketUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");
        socket = io(socketUrl || undefined, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            withCredentials: true
        });
    }
    return socket;
}
