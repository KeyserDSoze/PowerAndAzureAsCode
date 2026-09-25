/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOST_TARGET: "powerapps" | "powerpages" | "azure";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
