package keeper

import (
	"context"
	"errors"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

func (k msgServer) UpdateComplaintStatus(goCtx context.Context, msg *types.MsgUpdateComplaintStatus) (*types.MsgUpdateComplaintStatusResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// 1. Fetch the existing complaint using the Collections API
	complaint, err := k.Complaint.Get(ctx, msg.Id)
	if err != nil {
		return nil, errors.New("complaint not found or invalid ID")
	}

	complaint.Status = msg.NewStatus
    
	// complaint.PublicNotes = msg.PublicNotes

	err = k.Complaint.Set(ctx, msg.Id, complaint)
	if err != nil {
		return nil, err
	}

	return &types.MsgUpdateComplaintStatusResponse{}, nil
}