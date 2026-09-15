export const DEFAULT_SUPPORTED_LANGUAGES = [
  { label: "English", value: "English" },
  { label: "తెలుగు", value: "Telugu" },
  { label: "हिन्दी", value: "Hindi" },
];

export function getSupportedLanguages() {
  const raw = process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES;

  if (!raw || !raw.trim()) {
    return DEFAULT_SUPPORTED_LANGUAGES;
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((value) => {
      const normalized = value.replace(/[_-]/g, " ").trim();

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
