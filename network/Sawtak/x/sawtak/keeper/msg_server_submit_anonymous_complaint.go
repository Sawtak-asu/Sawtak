package keeper

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"

	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"

	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

// BackendPubKeyBase64 is the ed25519 public key of the backend server used to verify
// anonymous complaints. The backend signs the anonymous identifier.
// Replace this with your actual base64 encoded public key.
const BackendPubKeyBase64 = "PLACEHOLDER_BASE64_PUBKEY"

func (k msgServer) SubmitAnonymousComplaint(goCtx context.Context, msg *types.MsgSubmitAnonymousComplaint) (*types.MsgSubmitAnonymousComplaintResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// --- 1. Cryptographic Verification ---
	// Decode the configured backend public key from base64
	pubKey, err := base64.StdEncoding.DecodeString(BackendPubKeyBase64)
	if err != nil {
		return nil, sdkerrors.ErrInvalidRequest.Wrapf("failed to decode backend public key: %s", err)
	}

	if len(pubKey) != ed25519.PublicKeySize {
		return nil, sdkerrors.ErrInvalidRequest.Wrapf("invalid backend public key size: expected %d, got %d", ed25519.PublicKeySize, len(pubKey))
	}

	// Decode the proof (signature) from base64
	signatureBytes, err := base64.StdEncoding.DecodeString(msg.Proof)
	if err != nil {
		return nil, sdkerrors.ErrInvalidRequest.Wrapf("invalid proof format, must be base64: %s", err)
	}

	// Verify the signature against the AnonymousIdentifier
	// The backend signs the AnonymousIdentifier string to authorize the submission
	isValid := ed25519.Verify(pubKey, []byte(msg.AnonymousIdentifier), signatureBytes)
	if !isValid {
		return nil, sdkerrors.ErrUnauthorized.Wrap("Invalid cryptographic proof")
	}

	// --- 2. Create and Save the Complaint ---
	// Create the Complaint object (without the ID first)
	var complaint = types.Complaint{
		TrackingId:          msg.TrackingId,
		AnonymousIdentifier: msg.AnonymousIdentifier,
		ComplaintType:       "anonymous",
		Title:               msg.Title,
		Text:                msg.Text,
		Category:            msg.Category,
		Area:                msg.Area,
		DirectedTo:          msg.DirectedTo,
		IncidentDate:        msg.IncidentDate,
		Evidence:            msg.Evidence,
		Status:              "submitted",
	}

	// Get the next ID from the database sequence
	id, err := k.ComplaintSeq.Next(ctx)
	if err != nil {
		return nil, err
	}
	complaint.Id = id

	// Save it directly to the LevelDB Collection
	err = k.Complaint.Set(ctx, id, complaint)
	if err != nil {
		return nil, err
	}

	// 4. Emit event for indexer
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			"sawtak.sawtak.v1.EventSubmitAnonymousComplaint",
			sdk.NewAttribute("tracking_id", msg.TrackingId),
			sdk.NewAttribute("proof", msg.Proof),
			sdk.NewAttribute("title", msg.Title),
			sdk.NewAttribute("text", msg.Text),
			sdk.NewAttribute("category", msg.Category),
			sdk.NewAttribute("area", msg.Area),
			sdk.NewAttribute("directed_to", msg.DirectedTo),
			sdk.NewAttribute("incident_date", msg.IncidentDate),
			sdk.NewAttribute("evidence", msg.Evidence),
		),
	})

	return &types.MsgSubmitAnonymousComplaintResponse{}, nil
}
