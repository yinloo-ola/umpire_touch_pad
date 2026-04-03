package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"umpire-backend/internal/store"
)

var ErrMatchLocked = errors.New("match is being umpired on another device")

type LockService struct {
	store store.Querier
}

func NewLockService(q store.Querier) *LockService {
	return &LockService{store: q}
}

func (s *LockService) Acquire(matchID, sessionID string) error {
	ctx := context.Background()
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

func (s *LockService) IsLockedBy(matchID, sessionID string) (bool, error) {
	ctx := context.Background()
	lock, err := s.store.GetMatchLock(ctx, matchID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return lock.SessionID == sessionID, nil
}

func (s *LockService) Touch(matchID, sessionID string) error {
	ctx := context.Background()
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

func (s *LockService) Release(matchID string) error {
	ctx := context.Background()
	return s.store.ReleaseMatchLock(ctx, matchID)
}

func (s *LockService) Prune() error {
	ctx := context.Background()
	return s.store.PruneExpiredLocks(ctx)
}
