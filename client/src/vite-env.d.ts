/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

type DesktopUpdateState =
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "unsupported"
  | "error";

interface DesktopUpdateStatus {
  state: DesktopUpdateState;
  version?: string;
  percent?: number;
  message?: string;
  releaseNotes?: string;
}

interface Window {
  chronosDesktop?: {
    platform: NodeJS.Platform;
    openExternal?: (url: string) => Promise<void>;
    updates?: {
      check: () => Promise<DesktopUpdateStatus>;
      download: () => Promise<DesktopUpdateStatus>;
      install: () => Promise<DesktopUpdateStatus>;
      onStatus: (listener: (status: DesktopUpdateStatus) => void) => () => void;
    };
  };
}
