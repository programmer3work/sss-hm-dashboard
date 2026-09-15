export const DEFAULT_SUPPORTED_LANGUAGES = [
  { label: "English", value: "English" },
  { label: "తెలుగు", value: "Telugu" },
  { label: "हिन्दी", value: "Hindi" },
  { label: "தமிழ்", value: "Tamil" },
  { label: "ಕನ್ನಡ", value: "Kannada" },
];

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
    };
  });
}
