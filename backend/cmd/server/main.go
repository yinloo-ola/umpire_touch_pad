package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"umpire-backend"
	"umpire-backend/db/migrations"
	"umpire-backend/internal/api"
	"umpire-backend/internal/service"
	"umpire-backend/internal/store"

	"github.com/pressly/goose/v3"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
)

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func main() {
	dbURL := os.Getenv("TURSO_DATABASE_URL")
	if dbURL == "" {
		dbURL = "file:sqlite.db"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	driver := "sqlite"
	if strings.HasPrefix(dbURL, "libsql://") || strings.HasPrefix(dbURL, "http://") || strings.HasPrefix(dbURL, "https://") {
		driver = "libsql"
		authToken := os.Getenv("TURSO_AUTH_TOKEN")
		if authToken != "" {
			dbURL = fmt.Sprintf("%s?authToken=%s", dbURL, authToken)
		}
	}

	db, err := sql.Open(driver, dbURL)
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

	// Serve static files
	api.StaticFS = backend.DistFS
	api.RegisterStaticRoutes(mux)

	handler := mux

	fmt.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Could not start server: %s\n", err.Error())
	}
}
