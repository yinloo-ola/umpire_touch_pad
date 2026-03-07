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
	db    *sql.DB
}

func NewMatchService(q store.Querier, db *sql.DB) *MatchService {
	return &MatchService{
		store: q,
		db:    db,
	}
}

type SyncGameRequest struct {
	GameNumber int    `json:"gameNumber"`
	Team1Score int    `json:"team1Score"`
	Team2Score int    `json:"team2Score"`
	Status     string `json:"status"`
}

type SyncCardRequest struct {
	TeamIndex   int    `json:"teamIndex"`
	PlayerIndex int    `json:"playerIndex"`
	CardType    string `json:"cardType"`
	Reason      string `json:"reason,omitempty"`
	GameNumber  int    `json:"gameNumber"`
}

type SyncMatchRequest struct {
	MatchID     string            `json:"matchId"`
	Status      string            `json:"status"`
	CurrentGame int               `json:"currentGame"`
	Game        SyncGameRequest   `json:"game"`
	Cards       []SyncCardRequest `json:"cards"`
}

func (s *MatchService) SyncMatch(ctx context.Context, req SyncMatchRequest) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// qtx allows using the generated store methods within a transaction
	qtx := store.New(tx)

	// 1. Update Match Status
	err = qtx.UpdateMatchStatus(ctx, store.UpdateMatchStatusParams{
		ID:          req.MatchID,
		Status:      req.Status,
		CurrentGame: int64(req.CurrentGame),
	})
	if err != nil {
		return err
	}

	// 2. Upsert Current Game
	newGameID := uuid.New().String()
	gameID, err := qtx.UpsertGame(ctx, store.UpsertGameParams{
		ID:         newGameID,
		MatchID:    req.MatchID,
		GameNumber: int64(req.Game.GameNumber),
		Team1Score: int64(req.Game.Team1Score),
		Team2Score: int64(req.Game.Team2Score),
		Status:     req.Game.Status,
	})
	if err != nil {
		return err
	}

	// 3. Clear existing cards for the match and insert updated list
	err = qtx.ClearCardsForMatch(ctx, req.MatchID)
	if err != nil {
		return err
	}

	// Cache for game IDs to avoid redundant lookups
	gameIDCache := make(map[int]string)
	gameIDCache[req.Game.GameNumber] = gameID

	for _, card := range req.Cards {
		targetGameID := ""
		if id, ok := gameIDCache[card.GameNumber]; ok {
			targetGameID = id
		} else {
			// Lookup game ID by number
			id, err := qtx.GetGameIDByNumber(ctx, store.GetGameIDByNumberParams{
				MatchID:    req.MatchID,
				GameNumber: int64(card.GameNumber),
			})
			if err == nil {
				targetGameID = id
				gameIDCache[card.GameNumber] = id
			}
		}

		cardID := uuid.New().String()
		err = qtx.CreateCard(ctx, store.CreateCardParams{
			ID:          cardID,
			MatchID:     req.MatchID,
			GameID:      sql.NullString{String: targetGameID, Valid: targetGameID != ""},
			TeamIndex:   int64(card.TeamIndex),
			PlayerIndex: int64(card.PlayerIndex),
			CardType:    card.CardType,
			Reason:      sql.NullString{String: card.Reason, Valid: card.Reason != ""},
		})
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *MatchService) CreateMatch(ctx context.Context, m Match) (string, error) {
	id := uuid.New().String()

	var t1p1, t1p2, t2p1, t2p2 string
	var t1p1c, t1p2c, t2p1c, t2p2c string

	if len(m.Team1) > 0 {
		t1p1 = m.Team1[0].Name
		t1p1c = m.Team1[0].Country
	}
	if len(m.Team1) > 1 {
		t1p2 = m.Team1[1].Name
		t1p2c = m.Team1[1].Country
	}
	if len(m.Team2) > 0 {
		t2p1 = m.Team2[0].Name
		t2p1c = m.Team2[0].Country
	}
	if len(m.Team2) > 1 {
		t2p2 = m.Team2[1].Name
		t2p2c = m.Team2[1].Country
	}

	arg := store.CreateMatchParams{
		ID:            id,
		Title:         m.Event,
		ScheduledDate: m.Time,
		Status:        "unstarted",
		CurrentGame:   1,
		Team1P1Name:   t1p1,
		Team2P1Name:   t2p1,
		BestOf:        int64(m.BestOf),
	}

	if t1p2 != "" {
		arg.Team1P2Name = sql.NullString{String: t1p2, Valid: true}
	}
	if t2p2 != "" {
		arg.Team2P2Name = sql.NullString{String: t2p2, Valid: true}
	}

	if t1p1c != "" {
		arg.Team1P1Country = sql.NullString{String: t1p1c, Valid: true}
	}
	if t1p2c != "" {
		arg.Team1P2Country = sql.NullString{String: t1p2c, Valid: true}
	}
	if t2p1c != "" {
		arg.Team2P1Country = sql.NullString{String: t2p1c, Valid: true}
	}
	if t2p2c != "" {
		arg.Team2P2Country = sql.NullString{String: t2p2c, Valid: true}
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
	// Use the same ISO 8601 local format that the frontend datetime-local input
	// writes to the DB: "2026-03-05T00:00:00" — T separator, no timezone offset.
	const naiveFmt = "2006-01-02T15:04:05"
	startOfDay := time.Date(y, m, d, 0, 0, 0, 0, now.Location()).Format(naiveFmt)
	endOfDay := time.Date(y, m, d, 23, 59, 59, 999999999, now.Location()).Format(naiveFmt)

	dbMatches, err := s.store.GetUnstartedMatchesForPeriod(ctx, store.GetUnstartedMatchesForPeriodParams{
		ScheduledDate:   startOfDay,
		ScheduledDate_2: endOfDay,
	})
	if err != nil {
		return nil, err
	}

	var results []Match
	for _, dbm := range dbMatches {
		t1 := []Player{{Name: dbm.Team1P1Name, Country: dbm.Team1P1Country.String}}
		if dbm.Team1P2Name.Valid && dbm.Team1P2Name.String != "" {
			t1 = append(t1, Player{Name: dbm.Team1P2Name.String, Country: dbm.Team1P2Country.String})
		}

		t2 := []Player{{Name: dbm.Team2P1Name, Country: dbm.Team2P1Country.String}}
		if dbm.Team2P2Name.Valid && dbm.Team2P2Name.String != "" {
			t2 = append(t2, Player{Name: dbm.Team2P2Name.String, Country: dbm.Team2P2Country.String})
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
			BestOf: int(dbm.BestOf),
			Team1:  t1,
			Team2:  t2,
		})
	}
	if results == nil {
		results = []Match{}
	}
	return results, nil
}
