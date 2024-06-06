/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL: string;
  }
}
