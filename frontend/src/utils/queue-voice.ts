function spellQueueNumber(queueNumber: string) {
  return queueNumber
    .split("")
    .map((char) => {
      if (char === "0") return "nol";
      if (char === "1") return "satu";
      if (char === "2") return "dua";
      if (char === "3") return "tiga";
      if (char === "4") return "empat";
      if (char === "5") return "lima";
      if (char === "6") return "enam";
      if (char === "7") return "tujuh";
      if (char === "8") return "delapan";
      if (char === "9") return "sembilan";
      return char;
    })
    .join(" ");
}

export type QueueVoiceOptions = {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
};

export function callQueueVoice(queueNumber: string, destination: string, options: QueueVoiceOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const text = `Nomor antrian ${spellQueueNumber(queueNumber)}, silakan menuju ${destination}.`;
  const speech = new SpeechSynthesisUtterance(text);
  const selectedVoice = window.speechSynthesis.getVoices().find((voice) => voice.voiceURI === options.voiceURI);

  speech.lang = "id-ID";
  speech.voice = selectedVoice ?? window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("id")) ?? null;
  speech.rate = options.rate ?? 0.85;
  speech.pitch = options.pitch ?? 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}


