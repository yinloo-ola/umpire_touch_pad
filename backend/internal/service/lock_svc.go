package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"umpire-backend/internal/store"
)

var ErrMatchLocked = errors.New("match is being umpired on another device")

// LockExpiry is the inactivity duration after which a match lock expires.
// Must be kept in sync with the '-30 seconds' literal in query.sql
// (AcquireMatchLock and PruneExpiredLocks queries).
const LockExpiry = 30 * time.Second

type LockService struct {
	store store.Querier
}

func NewLockService(q store.Querier) *LockService {
	return &LockService{store: q}
}

func (s *LockService) Acquire(ctx context.Context, matchID, sessionID string) error {
	_ = s.store.PruneExpiredLocks(ctx)

	res, err := s.store.AcquireMatchLock(ctx, store.AcquireMatchLockParams{
		MatchID:   matchID,
		SessionID: sessionID,
	})
	if err != nil {
		return fmt.Errorf("lock acquisition failed: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrMatchLocked
	}
	return nil
}

func (s *LockService) IsLockedBy(ctx context.Context, matchID, sessionID string) (bool, error) {
	lock, err := s.store.GetMatchLock(ctx, matchID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return lock.SessionID == sessionID, nil
}

func (s *LockService) Touch(ctx context.Context, matchID, sessionID string) error {
	res, err := s.store.TouchMatchLock(ctx, store.TouchMatchLockParams{
		MatchID:   matchID,
		SessionID: sessionID,
	})
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("no matching lock found for match %s and session %s", matchID, sessionID)
	}
	return nil
}

func (s *LockService) Release(ctx context.Context, matchID string) error {
	return s.store.ReleaseMatchLock(ctx, matchID)
}

func (s *LockService) Prune(ctx context.Context) error {
	return s.store.PruneExpiredLocks(ctx)
}
