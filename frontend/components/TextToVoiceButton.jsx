"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { getTtsLanguageCode } from "@/config/languages";

const aiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_API_BASE_URL,
});

export default function TextToVoiceButton({
  text,
  language = "English",
  languageCode,
  userEmail = "",
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  const stopAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
    setIsSpeaking(false);
  };

  useEffect(() => () => stopAudio(), []);

  const handleTextToVoice = async () => {
    try {
      // Stop currently playing audio
      if (isSpeaking && audioRef.current) {
        stopAudio();
        return;
      }

      if (!text?.trim()) {
        alert("Please generate an assessment first.");
        return;
      }

      setLoading(true);

      const payload = {
        text,
        language: languageCode || getTtsLanguageCode(language),
        language_name: language,
        user_email: userEmail,
        client_name: "SSS",
      };

      console.log("Text To Voice Request:", payload);

      const res = await aiApi.post(
        "/api/hm/text-to-voice",
        payload
      );

      console.log(
        "Text To Voice Response:",
        res.data
      );

      const audioBase64 =
        res.data?.audio_base64;

      if (!audioBase64) {
        throw new Error(
          "audio_base64 not found in response"
        );
      }

      const audio = new Audio(
        `data:audio/mpeg;base64,${audioBase64}`
      );

      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error(
          "Audio Playback Error:",
          error
        );

        setIsSpeaking(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error(
        "Text To Voice Error:",
        error?.response?.data || error
      );

      alert("Text to voice failed.");

      setIsSpeaking(false);
      audioRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTextToVoice}
      disabled={!text?.trim()}
      className="tts-btn"
    >
      {loading
        ? "Generating Audio..."
        : isSpeaking
          ? "⏹ Stop Audio"
          : "🔊 Listen"}
    </button>
  );
}