import React, { useState, useRef } from "react";

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  console.log(audioUrl);
  console.log(audioChunksRef);
  console.log(mediaRecorderRef);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Microphone not supported on this device/browser or permission denied"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic permission or recording failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="p-4 space-y-3">
      {!recording ? (
        <button
          onClick={startRecording}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Stop Recording
        </button>
      )}

      {audioUrl && (
        <div>
          <h3>Recorded Audio:</h3>
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
