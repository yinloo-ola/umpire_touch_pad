package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/rs/cors"
)

type Player struct {
	Name    string `json:"name"`
	Country string `json:"country"`
}

type Match struct {
	Type   string   `json:"type"`
	Event  string   `json:"event"`
	Time   string   `json:"time"`
	BestOf int      `json:"bestOf"`
	Team1  []Player `json:"team1"`
	Team2  []Player `json:"team2"`
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func getMatches(w http.ResponseWriter, r *http.Request) {
	matches := []Match{
		{
			Type:   "singles",
			Event:  "Men's Singles",
			Time:   "09:00",
			BestOf: 5,
			Team1:  []Player{{Name: "JEOUNG Youngsik", Country: "KOR"}},
			Team2:  []Player{{Name: "SAMSONOV Vladimir", Country: "BLR"}},
		},
		{
			Type:   "doubles",
			Event:  "Men's Doubles",
			Time:   "09:00",
			BestOf: 5,
			Team1:  []Player{{Name: "HU Heming", Country: "AUS"}, {Name: "YAN Xin", Country: "AUS"}},
			Team2:  []Player{{Name: "NUYTINCK Cedric", Country: "BEL"}, {Name: "DYJAS Jakub", Country: "POL"}},
		},
		{
			Type:   "singles",
			Event:  "Men's Singles",
			Time:   "10:00",
			BestOf: 5,
			Team1:  []Player{{Name: "CHUANG Chih-Yuan", Country: "TPE"}},
			Team2:  []Player{{Name: "FREITAS Marcos", Country: "POR"}},
		},
		{
			Type:   "doubles",
			Event:  "Men's Doubles",
			Time:   "11:00",
			BestOf: 5,
			Team1:  []Player{{Name: "ALTO Gaston", Country: "ARG"}, {Name: "CIFUENTES Horacio", Country: "ARG"}},
			Team2:  []Player{{Name: "POWELL David", Country: "AUS"}, {Name: "TOWNSEND Kane", Country: "AUS"}},
		},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(matches)
}

func saveMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Match saved"))
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", healthCheck)
	mux.HandleFunc("/api/matches", getMatches)
	mux.HandleFunc("/api/match", saveMatch)

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
	})

	handler := c.Handler(mux)

	port := ":8080"
	fmt.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatalf("Could not start server: %s\n", err.Error())
	}
}
