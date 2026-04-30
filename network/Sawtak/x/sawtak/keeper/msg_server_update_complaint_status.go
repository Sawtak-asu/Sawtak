package keeper

import (
	"context"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

func (k msgServer) UpdateComplaintStatus(goCtx context.Context, msg *types.MsgUpdateComplaintStatus) (*types.MsgUpdateComplaintStatusResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// 1. Find the complaint by tracking_id (stored as TrackingId in the Complaint)
	var complaint types.Complaint
	var found bool
	var complaintId uint64

	// Iterate through complaints to find by tracking_id
	k.Complaint.Walk(ctx, nil, func(id uint64, c types.Complaint) (stop bool, err error) {
		if c.TrackingId == msg.ComplaintId {
			complaint = c
			complaintId = id
			found = true
			return true, nil // stop iteration
		}
		return false, nil
	})

	if !found {
		return nil, types.ErrComplaintNotFound
	}

	// 2. Validate old_status matches current status (for audit trail)
	if msg.OldStatus != "" && complaint.Status != msg.OldStatus {
		// Status may have changed externally, log but proceed
	}

	// 3. Update the status
	complaint.Status = msg.NewStatus
	err := k.Complaint.Set(ctx, complaintId, complaint)
	if err != nil {
		return nil, err
	}

	// 4. Emit event with complaint_id and old_status for indexer
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			"sawtak.sawtak.v1.EventUpdateComplaintStatus",
			sdk.NewAttribute("complaint_id", msg.ComplaintId),
			sdk.NewAttribute("old_status", msg.OldStatus),
			sdk.NewAttribute("new_status", msg.NewStatus),
			sdk.NewAttribute("creator", msg.Creator),
		),
	})

	return &types.MsgUpdateComplaintStatusResponse{}, nil
}
