package service

import (
	"context"
	"database/sql"
	"time"

	"umpire-backend/internal/store"

	"github.com/google/uuid"
)

type Player struct {
	Name    string `json:"name"`
	Country string `json:"country"`
}

type Match struct {
	ID     string   `json:"id"`
	Type   string   `json:"type"`
	Event  string   `json:"event"`
	Time   string   `json:"time"`
	BestOf int      `json:"bestOf"`
	Team1  []Player `json:"team1"`
	Team2  []Player `json:"team2"`
}

type MatchService struct {
	store store.Querier
}

func NewMatchService(q store.Querier) *MatchService {
	return &MatchService{store: q}
}

func (s *MatchService) CreateMatch(ctx context.Context, m Match) (string, error) {
	id := uuid.New().String()

	var t1p1, t1p2, t2p1, t2p2 string
	if len(m.Team1) > 0 {
		t1p1 = m.Team1[0].Name
	}
	if len(m.Team1) > 1 {
		t1p2 = m.Team1[1].Name
	}
	if len(m.Team2) > 0 {
		t2p1 = m.Team2[0].Name
	}
	if len(m.Team2) > 1 {
		t2p2 = m.Team2[1].Name
	}

	arg := store.CreateMatchParams{
		ID:            id,
		Title:         m.Event,
		ScheduledDate: m.Time,
		Status:        "unstarted",
		CurrentGame:   1,
		Team1P1Name:   t1p1,
		Team2P1Name:   t2p1,
	}

	if t1p2 != "" {
		arg.Team1P2Name = sql.NullString{String: t1p2, Valid: true}
	}
	if t2p2 != "" {
		arg.Team2P2Name = sql.NullString{String: t2p2, Valid: true}
	}

	err := s.store.CreateMatch(ctx, arg)
	if err != nil {
		return "", err
	}

	return id, nil
}

func (s *MatchService) GetTodayUnstartedMatches(ctx context.Context) ([]Match, error) {
	now := time.Now()
	y, m, d := now.Date()
	startOfDay := time.Date(y, m, d, 0, 0, 0, 0, now.Location()).Format(time.RFC3339)
	endOfDay := time.Date(y, m, d, 23, 59, 59, 999999999, now.Location()).Format(time.RFC3339)

	dbMatches, err := s.store.GetUnstartedMatchesForPeriod(ctx, store.GetUnstartedMatchesForPeriodParams{
		ScheduledDate:   startOfDay,
		ScheduledDate_2: endOfDay,
	})
	if err != nil {
		return nil, err
	}

	var results []Match
	for _, dbm := range dbMatches {
		t1 := []Player{{Name: dbm.Team1P1Name, Country: ""}}
		if dbm.Team1P2Name.Valid && dbm.Team1P2Name.String != "" {
			t1 = append(t1, Player{Name: dbm.Team1P2Name.String, Country: ""})
		}

		t2 := []Player{{Name: dbm.Team2P1Name, Country: ""}}
		if dbm.Team2P2Name.Valid && dbm.Team2P2Name.String != "" {
			t2 = append(t2, Player{Name: dbm.Team2P2Name.String, Country: ""})
		}

		matchType := "singles"
		if len(t1) > 1 {
			matchType = "doubles"
		}

		results = append(results, Match{
			ID:     dbm.ID,
			Type:   matchType,
			Event:  dbm.Title,
			Time:   dbm.ScheduledDate,
			BestOf: 5,
			Team1:  t1,
			Team2:  t2,
		})
	}
	if results == nil {
		results = []Match{}
	}
	return results, nil
}
