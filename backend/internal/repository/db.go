package repository

import (
	"context"
	"encoding/json"

	"homeschool-journal/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct{ db *pgxpool.Pool }

func New(ctx context.Context, url string) (*Repo, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, err
	}
	// Aman untuk Supabase pooler (transaction mode)
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	return &Repo{db: pool}, pool.Ping(ctx)
}

func (r *Repo) Close() { r.db.Close() }

func (r *Repo) Categories(ctx context.Context) ([]models.Category, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, slug, color FROM categories ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Category{}
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Color); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repo) List(ctx context.Context, categoryID int) ([]models.Activity, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.id, a.user_id::text, a.title, to_char(a.activity_date,'YYYY-MM-DD'),
		       a.category_id, c.name, c.color, a.location, a.description,
		       a.image_url, a.image_caption, a.video_url, COALESCE(a.likes_count,0), p.full_name, COALESCE(a.blocks,'[]'::jsonb)::text
		FROM activities a
		LEFT JOIN categories c ON c.id = a.category_id
		LEFT JOIN profiles p ON p.id = a.user_id
		WHERE ($1::int = 0 OR a.category_id = $1::int)
		ORDER BY a.activity_date DESC, a.id DESC LIMIT 100`, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Activity{}
	for rows.Next() {
		var a models.Activity
		var blocks string
		if err := rows.Scan(&a.ID, &a.UserID, &a.Title, &a.ActivityDate, &a.CategoryID, &a.CategoryName,
			&a.CategoryColor, &a.Location, &a.Description, &a.ImageURL, &a.ImageCaption, &a.VideoURL,
			&a.LikesCount, &a.AuthorName, &blocks); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(blocks), &a.Blocks)
		if a.Blocks == nil {
			a.Blocks = []models.Block{}
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *Repo) Create(ctx context.Context, userID string, in models.ActivityInput) (int64, error) {
	var id int64
	err := r.db.QueryRow(ctx, `
		INSERT INTO activities (user_id, title, activity_date, category_id, location, description, image_url, image_caption, video_url, blocks)
		VALUES ($1::uuid,$2,$3::date,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING id`,
		userID, in.Title, in.ActivityDate, in.CategoryID, in.Location, in.Description,
		in.ImageURL, in.ImageCaption, in.VideoURL, blocksJSON(in.Blocks)).Scan(&id)
	return id, err
}

// Update dan Delete hanya berlaku untuk pemilik jurnal.
func (r *Repo) Update(ctx context.Context, id int64, userID string, in models.ActivityInput) (bool, error) {
	tag, err := r.db.Exec(ctx, `
		UPDATE activities SET title=$3, activity_date=$4::date, category_id=$5, location=$6,
		  description=$7, image_url=$8, image_caption=$9, video_url=$10, blocks=$11::jsonb
		WHERE id=$1 AND user_id=$2::uuid`,
		id, userID, in.Title, in.ActivityDate, in.CategoryID, in.Location, in.Description,
		in.ImageURL, in.ImageCaption, in.VideoURL, blocksJSON(in.Blocks))
	return tag.RowsAffected() > 0, err
}

func (r *Repo) Delete(ctx context.Context, id int64, userID string) (bool, error) {
	tag, err := r.db.Exec(ctx, `DELETE FROM activities WHERE id=$1 AND user_id=$2::uuid`, id, userID)
	return tag.RowsAffected() > 0, err
}

func (r *Repo) Like(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx, `UPDATE activities SET likes_count = COALESCE(likes_count,0) + 1 WHERE id=$1`, id)
	return err
}

func blocksJSON(b []models.Block) string {
	if b == nil {
		b = []models.Block{}
	}
	out, _ := json.Marshal(b)
	return string(out)
}
