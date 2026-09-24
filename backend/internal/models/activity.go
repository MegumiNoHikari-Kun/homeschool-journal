package models

type Category struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Slug  string  `json:"slug"`
	Color *string `json:"color"`
}

type Activity struct {
	ID            int64   `json:"id"`
	UserID        string  `json:"user_id"`
	Title         string  `json:"title"`
	ActivityDate  string  `json:"activity_date"`
	CategoryID    *int    `json:"category_id"`
	CategoryName  *string `json:"category_name"`
	CategoryColor *string `json:"category_color"`
	Location      string  `json:"location"`
	Description   string  `json:"description"`
	ImageURL      *string `json:"image_url"`
	ImageCaption  *string `json:"image_caption"`
	VideoURL      *string `json:"video_url"`
	LikesCount    int     `json:"likes_count"`
	AuthorName    *string `json:"author_name"`
}

type ActivityInput struct {
	Title        string  `json:"title"`
	ActivityDate string  `json:"activity_date"`
	CategoryID   *int    `json:"category_id"`
	Location     string  `json:"location"`
	Description  string  `json:"description"`
	ImageURL     *string `json:"image_url"`
	ImageCaption *string `json:"image_caption"`
	VideoURL     *string `json:"video_url"`
}
