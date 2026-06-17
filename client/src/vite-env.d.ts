/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface Window {
  chronosDesktop?: {
    platform: NodeJS.Platform;
    openExternal?: (url: string) => Promise<void>;
  };
}
