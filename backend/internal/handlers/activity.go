package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"homeschool-journal/internal/models"
	"homeschool-journal/internal/repository"

	"github.com/go-chi/chi/v5"
)

type Handler struct{ Repo *repository.Repo }

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func serverError(w http.ResponseWriter, err error) {
	log.Println("error:", err)
	writeError(w, http.StatusInternalServerError, "Terjadi kesalahan di server.")
}

func parseInput(w http.ResponseWriter, r *http.Request) (models.ActivityInput, bool) {
	var in models.ActivityInput
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "Data tidak valid.")
		return in, false
	}
	in.Title, in.Location, in.Description = strings.TrimSpace(in.Title), strings.TrimSpace(in.Location), strings.TrimSpace(in.Description)
	if _, err := time.Parse("2006-01-02", in.ActivityDate); err != nil || in.Title == "" || in.Location == "" || in.Description == "" {
		writeError(w, http.StatusBadRequest, "Judul, tanggal, lokasi, dan cerita kegiatan wajib diisi.")
		return in, false
	}
	return in, true
}

func idParam(r *http.Request) (int64, error) { return strconv.ParseInt(chi.URLParam(r, "id"), 10, 64) }

func (h *Handler) Categories(w http.ResponseWriter, r *http.Request) {
	out, err := h.Repo.Categories(r.Context())
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	cat, _ := strconv.Atoi(r.URL.Query().Get("category"))
	out, err := h.Repo.List(r.Context(), cat)
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	in, ok := parseInput(w, r)
	if !ok {
		return
	}
	id, err := h.Repo.Create(r.Context(), UserID(r.Context()), in)
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := idParam(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID tidak valid.")
		return
	}
	in, ok := parseInput(w, r)
	if !ok {
		return
	}
	found, err := h.Repo.Update(r.Context(), id, UserID(r.Context()), in)
	if err != nil {
		serverError(w, err)
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "Jurnal tidak ditemukan atau bukan milik Anda.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := idParam(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID tidak valid.")
		return
	}
	found, err := h.Repo.Delete(r.Context(), id, UserID(r.Context()))
	if err != nil {
		serverError(w, err)
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "Jurnal tidak ditemukan atau bukan milik Anda.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Like(w http.ResponseWriter, r *http.Request) {
	id, err := idParam(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID tidak valid.")
		return
	}
	if err := h.Repo.Like(r.Context(), id); err != nil {
		serverError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
