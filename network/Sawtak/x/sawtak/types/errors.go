package types

// DONTCOVER

import (
	"cosmossdk.io/errors"
)

// x/sawtak module sentinel errors
var (
	ErrInvalidSigner     = errors.Register(ModuleName, 1100, "expected gov account as only signer for proposal message")
	ErrComplaintNotFound = errors.Register(ModuleName, 1101, "complaint not found")
)
