/// <reference types="vite/client" />

// Natively SDK type declarations
interface NativelyFirebaseNotifications {
  firebase_request_permission(callback: (result: { status: string }) => void): void;
  firebase_get_token(callback: (result: { token: string }) => void): void;
  firebase_get_apns_token(callback: (result: { token: string }) => void): void;
}

interface NativelyInfo {
  isNativeApp: boolean;
  isIOSApp: boolean;
  isAndroidApp: boolean;
}

declare global {
  interface Window {
    natively?: NativelyInfo;
    NativelyFirebaseNotifications?: new () => NativelyFirebaseNotifications;
  }
}

export {};
