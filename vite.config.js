import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os';

// Returns the local ip address
function getLocalIP()
{
  const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
  return 'localhost';
}


export default defineConfig(({ mode }) => {
    const backendURL = mode === 'production'
        ? process.env.VITE_API_URL
        : `http://${getLocalIP()}:3001`;
    console.log("Backend URL:", backendURL);

    return {
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 3000,
            proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3001',
                ws: true,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/socket.io/, '/socket.io') 
            },
        },
            allowedHosts: ['peaceless-protrusive-raphael.ngrok-free.dev']
        },
        // define: {
        //     'import.meta.env.VITE_API_URL': JSON.stringify(backendURL)
        // }
    }
})
