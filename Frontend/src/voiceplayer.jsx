import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export default function ChatAudio({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => setProgress(audio.currentTime);
    const loaded = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", loaded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const format = (sec) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Fixed bar heights like WhatsApp waveform
  const barHeights = [10, 16, 8, 20, 12, 18, 14, 22, 16, 10, 18, 12, 20, 8, 14, 18, 10, 16, 12, 20];

  return (
    <div className="flex items-center gap-3 bg-green-100 dark:bg-green-900 rounded-2xl px-3 py-2 w-72">
      {/* Play / Pause Button */}
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-green-500 text-white shadow"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-0.5">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-sm transition-colors duration-200 ${
              progress / duration > i / barHeights.length
                ? "bg-green-600"
                : "bg-gray-400 dark:bg-gray-600"
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Duration (remaining time) */}
      <span className="text-xs text-gray-700 dark:text-gray-300 font-mono w-10 text-right">
        {format(duration - progress)}
      </span>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
