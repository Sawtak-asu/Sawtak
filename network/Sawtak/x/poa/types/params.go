package types

// DefaultParams returns a default set of parameters.
func DefaultParams() Params {
	return Params{
		Admin:              "", // must be set in genesis
		AllowedValidators:  []string{},
	}
}

// Validate validates the set of params.
func (p Params) Validate() error {
	// Admin can be empty at default, but should be set in genesis
	return nil
}
