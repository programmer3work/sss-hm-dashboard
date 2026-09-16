export const DEFAULT_SUPPORTED_LANGUAGES = [
  { label: "English", value: "English", ttsCode: "en-US" },
  { label: "తెలుగు", value: "Telugu", ttsCode: "te-IN" },
  { label: "हिन्दी", value: "Hindi", ttsCode: "hi-IN" },
  { label: "தமிழ்", value: "Tamil", ttsCode: "ta-IN" },
  { label: "ಕನ್ನಡ", value: "Kannada", ttsCode: "kn-IN" },
];

export function getTtsLanguageCode(language) {
  const configuredCodes = process.env.NEXT_PUBLIC_TTS_LANGUAGE_CODES;
  const configuredCode = configuredCodes
    ?.split(",")
    .map((entry) => entry.trim().split(":"))
    .find(([name]) => name?.toLowerCase() === language?.toLowerCase())?.[1];

  if (configuredCode) {
    return configuredCode.trim();
  }

  return DEFAULT_SUPPORTED_LANGUAGES.find(
    (entry) => entry.value.toLowerCase() === language?.toLowerCase()
  )?.ttsCode || language;
}

export function getSupportedLanguages() {
  const raw = process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES;

  if (!raw || !raw.trim()) {
    return DEFAULT_SUPPORTED_LANGUAGES;
  }

  const configuredLanguages = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((value) => value.replace(/[_-]/g, " ").trim());

  const configuredValues = new Set(configuredLanguages.map((value) => value.toLowerCase()));
  const additionalDefaults = DEFAULT_SUPPORTED_LANGUAGES
    .map((lang) => lang.value)
    .filter((value) => !configuredValues.has(value.toLowerCase()));

  return [...configuredLanguages, ...additionalDefaults].map((value) => {
    const normalized = value.trim();

    const match = DEFAULT_SUPPORTED_LANGUAGES.find(
      (lang) => lang.value.toLowerCase() === normalized.toLowerCase()
    );

    if (match) {
      return match;
    }

    return {
      label: normalized,
      value: normalized,
      ttsCode: getTtsLanguageCode(normalized),
    };
  });
}
