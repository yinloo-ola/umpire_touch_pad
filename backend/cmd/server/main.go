package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"umpire-backend/db/migrations"
	"umpire-backend/internal/api"
	"umpire-backend/internal/service"
	"umpire-backend/internal/store"

	"github.com/pressly/goose/v3"
	"github.com/rs/cors"
	_ "modernc.org/sqlite"
)

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "sqlite.db"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	// Run Goose migrations using embedded SQL files
	goose.SetBaseFS(migrations.EmbedFS)

	if err := goose.SetDialect("sqlite"); err != nil {
		log.Fatalf("failed to set goose dialect: %v", err)
	}

	if err := goose.Up(db, "."); err != nil {
		log.Fatalf("failed to run goose migrations: %v", err)
	}
	log.Println("Database migrations applied successfully")

	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", healthCheck)

	querier := store.New(db)
	svc := service.NewMatchService(querier, db)
	authSvc := service.NewAuthService()
	api.SetupRoutes(mux, svc, authSvc)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	fmt.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Could not start server: %s\n", err.Error())
	}
}
