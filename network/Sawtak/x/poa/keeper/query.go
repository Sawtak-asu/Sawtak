package keeper

import (
	"context"

	"github.com/sayedibrahimQ/sawtak/x/poa/types"
)

type queryServer struct {
	k Keeper
}

var _ types.QueryServer = queryServer{}

// NewQueryServerImpl returns an implementation of the module QueryServer interface.
func NewQueryServerImpl(keeper Keeper) types.QueryServer {
	return &queryServer{k: keeper}
}

// Params returns the current PoA module parameters.
func (qs queryServer) Params(ctx context.Context, _ *types.QueryParamsRequest) (*types.QueryParamsResponse, error) {
	params, err := qs.k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	return &types.QueryParamsResponse{Params: params}, nil
}
