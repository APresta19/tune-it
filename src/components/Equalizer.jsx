import { useEffect, useRef } from "react";
import "../css/Equalizer.css";
import { getAudioAnalysis } from "../../backend/services/spotifyService.js";

function Equalizer({ trackUri })
{
    const trackId = trackUri?.replace("spotify:track:", "");

    const speed = 0.006;
    const NUM_BARS = 20;
    const MAX_HEIGHT = 150;
    const barsRef = useRef([]);

    const tempo = useRef(120);

    useEffect(() => {
        console.log("trackId received:", trackId);
        if (!trackId) return;
        
        async function fetchAnalysis() {
            const analysis = await getAudioAnalysis(trackId);
            console.log("Audio analysis:", analysis);
            tempo.current = analysis?.track?.tempo || 120;
        }
        
        fetchAnalysis();
    }, [trackId]);

    function getHeight(i, t, adjustedSpeed)
    {
        const phase = (i / NUM_BARS) * 2 * Math.PI;
        return (Math.sin(t * adjustedSpeed + phase) + 1) * MAX_HEIGHT; // Height between 0 and 1
    }

    useEffect(() =>
    {
        let animation;
        const loopBars = () => {
            const t = Date.now();
            const adjustedSpeed = speed * (tempo.current / 120);
            barsRef.current.forEach((bar, i) =>
            {
                if (bar)
                {
                    const height = getHeight(i, t, adjustedSpeed);
                    bar.style.height = `${height}px`;
                }
            });
            animation = requestAnimationFrame(loopBars);
        }
        animation = requestAnimationFrame(loopBars);

        return () => cancelAnimationFrame(animation);
    }, []);

    return (
        <div className="equalizer">
            {Array.from({ length: NUM_BARS }, (_, i) => (
                <div
                key={i}
                className="bar"
                ref={el => barsRef.current[i] = el}
                />
            ))}
        </div>
    );
}

export default Equalizer;