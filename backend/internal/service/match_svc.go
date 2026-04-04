package service

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"umpire-backend/internal/store"

	"github.com/google/uuid"
)

type Player struct {
	Name    string `json:"name"`
	Country string `json:"country"`
}

type Match struct {
	ID          string   `json:"id"`
	Type        string   `json:"type"`
	Event       string   `json:"event"`
	Time        string   `json:"time"`
	BestOf      int      `json:"bestOf"`
	Team1       []Player `json:"team1"`
	Team2       []Player `json:"team2"`
	Status      string   `json:"status,omitempty"`
	StateJson   string   `json:"stateJson,omitempty"`
	TableNumber int      `json:"tableNumber,omitempty"`
	CurrentGame int      `json:"currentGame,omitempty"`
	Remarks     string   `json:"remarks,omitempty"`
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
	StateJson   string            `json:"stateJson,omitempty"`
	Game        SyncGameRequest   `json:"game"`
	Cards       []SyncCardRequest `json:"cards"`
}

type MatchFullState struct {
	Match Match             `json:"match"`
	Games []SyncGameRequest `json:"games"`
	Cards []SyncCardRequest `json:"cards"`
}

type AdminMatchUpdateRequest struct {
	Status  string            `json:"status"`
	Remarks string            `json:"remarks"`
	Games   []SyncGameRequest `json:"games"`
	Cards   []SyncCardRequest `json:"cards"`
}

func (s *MatchService) AdminUpdateMatch(ctx context.Context, matchID string, req AdminMatchUpdateRequest) error {
	log.Printf("[AdminUpdateMatch] Updating match %s with status=%s, remarks=%q, games=%d, cards=%d",
		matchID, req.Status, req.Remarks, len(req.Games), len(req.Cards))

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	qtx := store.New(tx)

	matchRec, err := qtx.GetMatch(ctx, matchID)
	if err != nil {
		log.Printf("[AdminUpdateMatch] Error fetching match %s: %v", matchID, err)
		return err
	}
	bestOf := int(matchRec.BestOf)
	gamesToWin := (bestOf / 2) + 1

	if len(req.Games) > bestOf {
		return fmt.Errorf("invalid game count: maximum games for Best of %d is %d", bestOf, bestOf)
	}

	trimmedRemarks := strings.TrimSpace(req.Remarks)
	t1Wins := 0
	t2Wins := 0

	// 1. Validate games and compute statuses
	for i := range req.Games {
		g := &req.Games[i]
		g.GameNumber = i + 1

		maxScore := g.Team1Score
		minScore := g.Team2Score
		winner := 1
		if g.Team2Score > maxScore {
			maxScore = g.Team2Score
			minScore = g.Team1Score
			winner = 2
		}

		isCompletedObj := maxScore >= 11 && maxScore-minScore >= 2

		if isCompletedObj {
			g.Status = "completed"
			if winner == 1 {
				t1Wins++
			} else {
				t2Wins++
			}
		} else {
			if req.Status == "unstarted" && maxScore == 0 && minScore == 0 {
				g.Status = "unstarted"
			} else {
				g.Status = "in_progress"
			}
		}

		if trimmedRemarks == "" {
			// Validate if objectively completed
			if g.Status == "completed" {
				if maxScore < 11 {
					return fmt.Errorf("invalid score: neither team reached 11 points in game %d", g.GameNumber)
				}
				if maxScore == 11 && minScore > 9 {
					return fmt.Errorf("invalid score: winning by 11 requires a 2-point difference in game %d", g.GameNumber)
				}
				if maxScore > 11 && maxScore-minScore != 2 {
					return fmt.Errorf("invalid score: deuce game requires exactly a 2-point difference in game %d", g.GameNumber)
				}
			}
		}

		// Sequence checking
		if t1Wins == gamesToWin || t2Wins == gamesToWin {
			if i < len(req.Games)-1 {
				return fmt.Errorf("invalid game sequence: match already won by game %d, cannot have game %d", g.GameNumber, i+2)
			}
		}
	}

	// 2. Match-level result checking
	if req.Status == "completed" {
		if t1Wins != gamesToWin && t2Wins != gamesToWin {
			if trimmedRemarks == "" {
				return fmt.Errorf("cannot set status to 'completed': no team has reached %d game wins. Please provide remarks (e.g. retirement/force-end reason)", gamesToWin)
			}
		}
	}

	// 3. Update match status & remarks
	err = qtx.AdminUpdateMatch(ctx, store.AdminUpdateMatchParams{
		Status:  req.Status,
		Remarks: sql.NullString{String: trimmedRemarks, Valid: trimmedRemarks != ""},
		ID:      matchID,
	})
	if err != nil {
		return err
	}

	// Release lock if admin resets match to unstarted
	if req.Status == "unstarted" {
		_ = qtx.ReleaseMatchLock(ctx, matchID)
	}

	// 4. Clear and insert games
	err = qtx.DeleteGamesForMatch(ctx, matchID)
	if err != nil {
		return err
	}

	gameIDCache := make(map[int]string)
	for _, g := range req.Games {
		newGameID := uuid.New().String()
		_, err := qtx.UpsertGame(ctx, store.UpsertGameParams{
			ID:         newGameID,
			MatchID:    matchID,
			GameNumber: int64(g.GameNumber),
			Team1Score: int64(g.Team1Score),
			Team2Score: int64(g.Team2Score),
			Status:     g.Status,
		})
		if err != nil {
			return err
		}
		gameIDCache[g.GameNumber] = newGameID
	}

	// 5. Handle Cards (Clear and Re-insert)
	err = qtx.ClearCardsForMatch(ctx, matchID)
	if err != nil {
		return err
	}
	for _, card := range req.Cards {
		targetGameID := gameIDCache[card.GameNumber]
		cardID := uuid.New().String()
		err = qtx.CreateCard(ctx, store.CreateCardParams{
			ID:          cardID,
			MatchID:     matchID,
			GameID:      sql.NullString{String: targetGameID, Valid: targetGameID != ""},
			TeamIndex:   int64(card.TeamIndex),
			PlayerIndex: int64(card.PlayerIndex),
			CardType:    card.CardType,
			Reason:      sql.NullString{String: card.Reason, Valid: card.Reason != ""},
		})
		if err != nil {
			log.Printf("[AdminUpdateMatch] Error creating card: %v", err)
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Printf("[AdminUpdateMatch] Successfully updated match %s", matchID)
	return nil
}

func (s *MatchService) SyncMatch(ctx context.Context, sessionID string, req SyncMatchRequest) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// qtx allows using the generated store methods within a transaction
	qtx := store.New(tx)

	// --- Lock orchestration ---
	lockSvc := NewLockService(qtx)
	_ = lockSvc.Prune(ctx)

	isLocked, lockErr := lockSvc.IsLockedBy(ctx, req.MatchID, sessionID)
	if lockErr != nil {
		return lockErr
	}

	if isLocked {
		if err := lockSvc.Touch(ctx, req.MatchID, sessionID); err != nil {
			// Lock was pruned between IsLockedBy and Touch (race window).
			// Re-acquire to keep the lock active.
			_ = lockSvc.Acquire(ctx, req.MatchID, sessionID)
		}
	} else {
		if req.Status == "starting" || req.Status == "warming_up" || req.Status == "in_progress" {
			if err := lockSvc.Acquire(ctx, req.MatchID, sessionID); err != nil {
				return err
			}
		}
	}
	// --- End lock orchestration ---

	// 1. Update Match Status & State
	if req.StateJson != "" {
		err = qtx.UpdateMatchState(ctx, store.UpdateMatchStateParams{
			ID:          req.MatchID,
			Status:      req.Status,
			CurrentGame: int64(req.CurrentGame),
			StateJson:   sql.NullString{String: req.StateJson, Valid: true},
		})
	} else {
		err = qtx.UpdateMatchStatus(ctx, store.UpdateMatchStatusParams{
			ID:          req.MatchID,
			Status:      req.Status,
			CurrentGame: int64(req.CurrentGame),
		})
	}
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

	// Release lock if match completed
	if req.Status == "completed" {
		_ = lockSvc.Release(ctx, req.MatchID)
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
		TableNumber:   sql.NullInt64{Int64: int64(m.TableNumber), Valid: m.TableNumber > 0},
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

func (s *MatchService) GetTodayMatches(ctx context.Context, sessionID string, history bool) ([]Match, error) {
	now := time.Now()
	y, m, d := now.Date()
	const naiveFmt = "2006-01-02T15:04:05"
	startOfDay := time.Date(y, m, d, 0, 0, 0, 0, now.Location()).Format(naiveFmt)
	endOfDay := time.Date(y, m, d, 23, 59, 59, 999999999, now.Location()).Format(naiveFmt)

	var dbMatches []MatchRow
	var err error

	if history {
		rows, err2 := s.store.GetAllMatches(ctx)
		err = err2
		if err == nil {
			for _, r := range rows {
				dbMatches = append(dbMatches, MatchRow{
					ID:             r.ID,
					Title:          r.Title,
					ScheduledDate:  r.ScheduledDate,
					Status:         r.Status,
					CurrentGame:    r.CurrentGame,
					Team1P1Name:    r.Team1P1Name,
					Team1P2Name:    r.Team1P2Name,
					Team2P1Name:    r.Team2P1Name,
					Team2P2Name:    r.Team2P2Name,
					BestOf:         r.BestOf,
					Team1P1Country: r.Team1P1Country,
					Team1P2Country: r.Team1P2Country,
					Team2P1Country: r.Team2P1Country,
					Team2P2Country: r.Team2P2Country,
					StateJson:      r.StateJson,
					TableNumber:    r.TableNumber,
					Remarks:        r.Remarks,
				})
			}
		}
	} else {
		rows, err2 := s.store.GetIncompleteMatchesForPeriod(ctx, store.GetIncompleteMatchesForPeriodParams{
			ScheduledDate:   startOfDay,
			ScheduledDate_2: endOfDay,
		})
		err = err2
		if err == nil {
			for _, r := range rows {
				dbMatches = append(dbMatches, MatchRow{
					ID:             r.ID,
					Title:          r.Title,
					ScheduledDate:  r.ScheduledDate,
					Status:         r.Status,
					CurrentGame:    r.CurrentGame,
					Team1P1Name:    r.Team1P1Name,
					Team1P2Name:    r.Team1P2Name,
					Team2P1Name:    r.Team2P1Name,
					Team2P2Name:    r.Team2P2Name,
					BestOf:         r.BestOf,
					Team1P1Country: r.Team1P1Country,
					Team1P2Country: r.Team1P2Country,
					Team2P1Country: r.Team2P1Country,
					Team2P2Country: r.Team2P2Country,
					StateJson:      r.StateJson,
					TableNumber:    r.TableNumber,
					Remarks:        r.Remarks,
				})
			}
		}
	}

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
			ID:          dbm.ID,
			Type:        matchType,
			Event:       dbm.Title,
			Time:        dbm.ScheduledDate,
			BestOf:      int(dbm.BestOf),
			Team1:       t1,
			Team2:       t2,
			Status:      dbm.Status,
			TableNumber: int(dbm.TableNumber.Int64),
			CurrentGame: int(dbm.CurrentGame),
			Remarks:     dbm.Remarks.String,
		})
	}

	// Lock filtering: non-history mode, exclude matches locked by other sessions
	if !history {
		lockSvc := NewLockService(s.store)
		_ = lockSvc.Prune(ctx)

		var filtered []Match
		for _, m := range results {
			isLockedByOther := false
			if lock, err := lockSvc.store.GetMatchLock(ctx, m.ID); err == nil {
				// If sessionID is empty, any existing lock is "other"
				if sessionID == "" || lock.SessionID != sessionID {
					isLockedByOther = true
				}
			}
			if !isLockedByOther {
				filtered = append(filtered, m)
			}
		}
		results = filtered
	}

	if results == nil {
		results = []Match{}
	}
	return results, nil
}

// MatchRow is a helper to unify the different Row structs from sqlc
type MatchRow struct {
	ID             string
	Title          string
	ScheduledDate  string
	Status         string
	CurrentGame    int64
	Team1P1Name    string
	Team1P2Name    sql.NullString
	Team2P1Name    string
	Team2P2Name    sql.NullString
	BestOf         int64
	Team1P1Country sql.NullString
	Team1P2Country sql.NullString
	Team2P1Country sql.NullString
	Team2P2Country sql.NullString
	StateJson      sql.NullString
	TableNumber    sql.NullInt64
	Remarks        sql.NullString
}

func (s *MatchService) GetMatchState(ctx context.Context, id string) (*MatchFullState, error) {
	dbm, err := s.store.GetMatch(ctx, id)
	if err != nil {
		return nil, err
	}

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

	m := Match{
		ID:          dbm.ID,
		Type:        matchType,
		Event:       dbm.Title,
		Time:        dbm.ScheduledDate,
		BestOf:      int(dbm.BestOf),
		Team1:       t1,
		Team2:       t2,
		Status:      dbm.Status,
		StateJson:   dbm.StateJson.String,
		TableNumber: int(dbm.TableNumber.Int64),
		CurrentGame: int(dbm.CurrentGame),
		Remarks:     dbm.Remarks.String,
	}

	dbGames, err := s.store.GetGamesForMatch(ctx, id)
	if err != nil {
		return nil, err
	}

	var games []SyncGameRequest
	gameIDToNumber := make(map[string]int)
	for _, g := range dbGames {
		games = append(games, SyncGameRequest{
			GameNumber: int(g.GameNumber),
			Team1Score: int(g.Team1Score),
			Team2Score: int(g.Team2Score),
			Status:     g.Status,
		})
		gameIDToNumber[g.ID] = int(g.GameNumber)
	}

	dbCards, err := s.store.GetCardsForMatch(ctx, id)
	if err != nil {
		return nil, err
	}

	var cards []SyncCardRequest
	for _, c := range dbCards {
		gameNum := 0
		if c.GameID.Valid {
			gameNum = gameIDToNumber[c.GameID.String]
		}
		cards = append(cards, SyncCardRequest{
			TeamIndex:   int(c.TeamIndex),
			PlayerIndex: int(c.PlayerIndex),
			CardType:    c.CardType,
			Reason:      c.Reason.String,
			GameNumber:  gameNum,
		})
	}

	return &MatchFullState{
		Match: m,
		Games: games,
		Cards: cards,
	}, nil
}

func (s *MatchService) DeleteMatch(ctx context.Context, id string) error {
	log.Printf("[DeleteMatch] Deleting match %s", id)
	return s.store.DeleteMatch(ctx, id)
}

func (s *MatchService) DeleteMatches(ctx context.Context, ids []string) error {
	log.Printf("[DeleteMatches] Deleting matches: %v", ids)
	return s.store.DeleteMatches(ctx, ids)
}

func (s *MatchService) ReleaseMatchLock(ctx context.Context, matchID, sessionID string) error {
	lockSvc := NewLockService(s.store)
	_ = lockSvc.Prune(ctx)

	isLocked, err := lockSvc.IsLockedBy(ctx, matchID, sessionID)
	if err != nil {
		return err
	}
	if !isLocked {
		// Either not locked, or locked by someone else. 
		// If locked by someone else, we shouldn't be able to release it anyway.
		return nil
	}

	return lockSvc.Release(ctx, matchID)
}

// PublicMatchResponse is the response shape for the public API
type PublicMatchResponse struct {
	Completed []PublicMatch `json:"completed"`
	Scheduled []PublicMatch `json:"scheduled"`
	Live      []PublicMatch `json:"live"`
}

// PublicMatch represents a match for public display (no internal fields)
type PublicMatch struct {
	ID            string         `json:"id"`
	Title         string         `json:"title"`
	ScheduledDate string         `json:"scheduledDate"`
	Status        string         `json:"status"`
	TableNumber   int            `json:"tableNumber"`
	Team1         []PublicPlayer `json:"team1"`
	Team2         []PublicPlayer `json:"team2"`
	Games         []PublicGame   `json:"games"`
}

// PublicPlayer represents a player for public display
type PublicPlayer struct {
	Name    string `json:"name"`
	Country string `json:"country"`
}

// PublicGame represents a game for public display
type PublicGame struct {
	GameNumber int    `json:"gameNumber"`
	Team1Score int    `json:"team1Score"`
	Team2Score int    `json:"team2Score"`
	Status     string `json:"status"`
}

// GetPublicMatches returns all matches grouped by status for public display
func (s *MatchService) GetPublicMatches(ctx context.Context) (*PublicMatchResponse, error) {
	// Get all matches
	rows, err := s.store.GetAllMatches(ctx)
	if err != nil {
		return nil, err
	}

	response := &PublicMatchResponse{
		Completed: []PublicMatch{},
		Scheduled: []PublicMatch{},
		Live:      []PublicMatch{},
	}

	for _, dbm := range rows {
		// Build teams
		t1 := []PublicPlayer{{Name: dbm.Team1P1Name, Country: dbm.Team1P1Country.String}}
		if dbm.Team1P2Name.Valid && dbm.Team1P2Name.String != "" {
			t1 = append(t1, PublicPlayer{Name: dbm.Team1P2Name.String, Country: dbm.Team1P2Country.String})
		}

		t2 := []PublicPlayer{{Name: dbm.Team2P1Name, Country: dbm.Team2P1Country.String}}
		if dbm.Team2P2Name.Valid && dbm.Team2P2Name.String != "" {
			t2 = append(t2, PublicPlayer{Name: dbm.Team2P2Name.String, Country: dbm.Team2P2Country.String})
		}

		// Get games for this match
		dbGames, err := s.store.GetGamesForMatch(ctx, dbm.ID)
		if err != nil {
			dbGames = nil // No games yet
		}

		var games []PublicGame
		for _, g := range dbGames {
			games = append(games, PublicGame{
				GameNumber: int(g.GameNumber),
				Team1Score: int(g.Team1Score),
				Team2Score: int(g.Team2Score),
				Status:     g.Status,
			})
		}
		if games == nil {
			games = []PublicGame{}
		}

		match := PublicMatch{
			ID:            dbm.ID,
			Title:         dbm.Title,
			ScheduledDate: dbm.ScheduledDate,
			Status:        dbm.Status,
			TableNumber:   int(dbm.TableNumber.Int64),
			Team1:         t1,
			Team2:         t2,
			Games:         games,
		}

		// Group by status
		switch dbm.Status {
		case "completed":
			response.Completed = append(response.Completed, match)
		case "in_progress":
			response.Live = append(response.Live, match)
		default: // unstarted, starting, warming_up, etc.
			response.Scheduled = append(response.Scheduled, match)
		}
	}

	return response, nil
}
