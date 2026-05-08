package keeper

import (
	"context"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

func (k msgServer) SubmitIdentifiedComplaint(goCtx context.Context, msg *types.MsgSubmitIdentifiedComplaint) (*types.MsgSubmitIdentifiedComplaintResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// 1. Create the Complaint object (without the ID first)
	var complaint = types.Complaint{
		TrackingId:    msg.TrackingId,
		ComplaintType: "identified",
		Title:         msg.Title,
		Text:          msg.Text, // Hash
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

	// 4. Emit event for indexer
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			"sawtak.sawtak.v1.EventSubmitIdentifiedComplaint",
			sdk.NewAttribute("tracking_id", msg.TrackingId),
			sdk.NewAttribute("title", msg.Title),
			sdk.NewAttribute("text", msg.Text),
			sdk.NewAttribute("category", msg.Category),
			sdk.NewAttribute("area", msg.Area),
			sdk.NewAttribute("directed_to", msg.DirectedTo),
			sdk.NewAttribute("incident_date", msg.IncidentDate),
			sdk.NewAttribute("evidence", msg.Evidence),
		),
	})

	return &types.MsgSubmitIdentifiedComplaintResponse{}, nil
}
