package config

import "os"

type Config struct {
	Port, DatabaseURL, SupabaseURL, SupabaseAnonKey, AllowedOrigin string
}

func Load() Config {
	return Config{
		Port:            get("PORT", "8080"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		SupabaseURL:     os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey: os.Getenv("SUPABASE_ANON_KEY"),
		AllowedOrigin:   get("ALLOWED_ORIGIN", "http://localhost:3000"),
	}
}

func get(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
