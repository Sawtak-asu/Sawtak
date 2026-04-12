package types

import (
	"cosmossdk.io/errors"
)

var (
	ErrUnauthorized        = errors.Register(ModuleName, 1100, "unauthorized: sender is not the PoA admin")
	ErrValidatorNotAllowed = errors.Register(ModuleName, 1101, "validator operator address is not in the allowed list")
	ErrInvalidAdmin        = errors.Register(ModuleName, 1102, "invalid admin address")
	ErrStakingActionBlocked = errors.Register(ModuleName, 1103, "staking action blocked: only the PoA admin can manage validators")
)
