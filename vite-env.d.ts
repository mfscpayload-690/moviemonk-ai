/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GROQ_API_KEY: string;
  readonly MISTRAL_API_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly TMDB_API_KEY: string;
  readonly TMDB_READ_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
