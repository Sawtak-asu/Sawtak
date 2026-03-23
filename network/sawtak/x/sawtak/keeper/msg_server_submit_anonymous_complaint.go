package keeper

import (
	"context"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

func (k msgServer) SubmitAnonymousComplaint(goCtx context.Context, msg *types.MsgSubmitAnonymousComplaint) (*types.MsgSubmitAnonymousComplaintResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)


	// 1. Create the Complaint object (without the ID first)
	var complaint = types.Complaint{
		TrackingId:    msg.TrackingId,
		ComplaintType: "anonymous", // Hardcoded for this message
		Title:         msg.Title,
		Text:          msg.Text,     // This is your Hash
		Category:      msg.Category,
		Area:          msg.Area,
		DirectedTo:    msg.DirectedTo,
		IncidentDate:  msg.IncidentDate,
		Evidence:      msg.Evidence,
		Status:        "submitted",
	}

	// 2. Get the next ID from the database sequence
	id, err := k.ComplaintSeq.Next(ctx)
	if err != nil {
		return nil, err
	}
	complaint.Id = id // Assign the generated ID to our object

	// 3. Save it directly to the LevelDB Collection
	err = k.Complaint.Set(ctx, id, complaint)
	if err != nil {
		return nil, err
	}

	return &types.MsgSubmitAnonymousComplaintResponse{}, nil
}
