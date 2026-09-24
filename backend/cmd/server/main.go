package main

import (
	"context"
	"log"
	"net/http"

	"homeschool-journal/internal/config"
	"homeschool-journal/internal/handlers"
	"homeschool-journal/internal/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := config.Load()
	repo, err := repository.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal("koneksi database gagal: ", err)
	}
	defer repo.Close()

	h := &handlers.Handler{Repo: repo}
	r := chi.NewRouter()
	r.Use(middleware.Logger, middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{cfg.AllowedOrigin},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	}))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("ok")) })
	r.Route("/api", func(r chi.Router) {
		r.Get("/categories", h.Categories)
		r.Get("/activities", h.List)
		r.Post("/activities/{id}/like", h.Like)
		r.Group(func(r chi.Router) {
			r.Use(handlers.Auth(cfg.SupabaseURL, cfg.SupabaseAnonKey))
			r.Post("/activities", h.Create)
			r.Put("/activities/{id}", h.Update)
			r.Delete("/activities/{id}", h.Delete)
		})
	})

	log.Println("API berjalan di :" + cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}
