package keeper

import (
	"context"

	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

// InitGenesis initializes the module's state from a provided genesis state.
func (k Keeper) InitGenesis(ctx context.Context, genState types.GenesisState) error {
	for _, elem := range genState.ComplaintList {
		if err := k.Complaint.Set(ctx, elem.Id, elem); err != nil {
			return err
		}
	}

	if err := k.ComplaintSeq.Set(ctx, genState.ComplaintCount); err != nil {
		return err
	}
	return k.Params.Set(ctx, genState.Params)
}

// ExportGenesis returns the module's exported genesis.
func (k Keeper) ExportGenesis(ctx context.Context) (*types.GenesisState, error) {
	var err error

	genesis := types.DefaultGenesis()
	genesis.Params, err = k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}
	err = k.Complaint.Walk(ctx, nil, func(key uint64, elem types.Complaint) (bool, error) {
		genesis.ComplaintList = append(genesis.ComplaintList, elem)
		return false, nil
	})
	if err != nil {
		return nil, err
	}

	genesis.ComplaintCount, err = k.ComplaintSeq.Peek(ctx)
	if err != nil {
		return nil, err
	}

	return genesis, nil
}
