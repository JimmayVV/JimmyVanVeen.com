/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite built-in variables
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;

  // Application environment variables (JVV_ prefixed - safe for client)
  readonly JVV_ALLOW_EMAILS: string;
  readonly JVV_RECAPTCHA_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Node.js environment variables (for server-side code)
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly PORT?: string;
    readonly CONTENTFUL_SPACE_ID?: string;
    readonly CONTENTFUL_ACCESS_TOKEN?: string;
    readonly CONTENTFUL_PREVIEW_TOKEN?: string;
    readonly GITHUB_TOKEN?: string;
    readonly EMAIL_SERVICE?: string;
    readonly EMAIL_ADDRESS?: string;
    readonly EMAIL_APP_PASSWORD?: string;
    readonly RECAPTCHA_SECRET_KEY?: string;
  }
}
