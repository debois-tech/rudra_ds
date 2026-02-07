declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_SUPABASE_URL: string;
        NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
        META_WHATSAPP_TOKEN?: string;
        META_WHATSAPP_PHONE_ID?: string;
    }
}
