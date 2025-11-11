/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VWORLD_API_KEY: string;
  readonly VITE_KAKAO_JS_KEY: string;
  readonly VITE_KAKAO_APP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
