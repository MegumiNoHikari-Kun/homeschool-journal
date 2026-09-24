package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type ctxKey struct{}

func UserID(ctx context.Context) string {
	id, _ := ctx.Value(ctxKey{}).(string)
	return id
}

// Auth memvalidasi token Supabase lewat endpoint /auth/v1/user,
// sehingga berfungsi untuk semua jenis kunci JWT Supabase.
func Auth(supabaseURL, anonKey string) func(http.Handler) http.Handler {
	client := &http.Client{Timeout: 5 * time.Second}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if token == "" {
				writeError(w, http.StatusUnauthorized, "Masuk dulu untuk melakukan ini.")
				return
			}
			req, _ := http.NewRequestWithContext(r.Context(), http.MethodGet, supabaseURL+"/auth/v1/user", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			req.Header.Set("apikey", anonKey)
			res, err := client.Do(req)
			if err != nil {
				writeError(w, http.StatusBadGateway, "Layanan autentikasi tidak dapat dihubungi.")
				return
			}
			defer res.Body.Close()
			var u struct {
				ID string `json:"id"`
			}
			if res.StatusCode != http.StatusOK || json.NewDecoder(res.Body).Decode(&u) != nil || u.ID == "" {
				writeError(w, http.StatusUnauthorized, "Sesi tidak valid. Masuk kembali.")
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, u.ID)))
		})
	}
}
