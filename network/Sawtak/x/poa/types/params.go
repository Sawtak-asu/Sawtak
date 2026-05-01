package types

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// DefaultParams returns a default set of parameters.
func DefaultParams() Params {
	return Params{
		Admin:             "", // must be set in genesis
		AllowedValidators: []string{},
	}
}

// Validate validates the set of params.
func (p Params) Validate() error {
	// Validate admin address if set
	if p.Admin != "" {
		if _, err := sdk.AccAddressFromBech32(p.Admin); err != nil {
			return fmt.Errorf("invalid admin address %q: %w", p.Admin, err)
		}
	}

	// Validate allowed validators
	seen := make(map[string]bool, len(p.AllowedValidators))
	for i, v := range p.AllowedValidators {
		if v == "" {
			return fmt.Errorf("allowed_validators[%d] is an empty string", i)
		}
		if _, err := sdk.AccAddressFromBech32(v); err != nil {
			return fmt.Errorf("invalid allowed_validator address %q at index %d: %w", v, i, err)
		}
		if seen[v] {
			return fmt.Errorf("duplicate allowed_validator: %s", v)
		}
		seen[v] = true
	}

	return nil
}
