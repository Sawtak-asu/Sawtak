package keeper

import (
	"context"
	"strings"

	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/sayedibrahimQ/sawtak/x/poa/types"
)

type msgServer struct {
	k Keeper
}

var _ types.MsgServer = msgServer{}

// NewMsgServerImpl returns an implementation of the module MsgServer interface.
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
	return &msgServer{k: keeper}
}

// UpdateParams updates the module parameters. Only the governance module (authority) can call this.
func (ms msgServer) UpdateParams(ctx context.Context, msg *types.MsgUpdateParams) (*types.MsgUpdateParamsResponse, error) {
	authorityAddr, err := ms.k.addressCodec.BytesToString(ms.k.authority)
	if err != nil {
		return nil, err
	}
	if msg.Authority != authorityAddr {
		return nil, types.ErrUnauthorized.Wrapf("expected %s, got %s", authorityAddr, msg.Authority)
	}

	if err := msg.Params.Validate(); err != nil {
		return nil, err
	}

	if err := ms.k.Params.Set(ctx, msg.Params); err != nil {
		return nil, err
	}

	// ──────────────────────────────────────────────────────────────
	// FIX: Emit event for auditability — UpdateParams
	// ──────────────────────────────────────────────────────────────
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	sdkCtx.EventManager().EmitEvent(sdk.NewEvent(
		"poa_params_updated",
		sdk.NewAttribute("authority", msg.Authority),
		sdk.NewAttribute("admin", msg.Params.Admin),
		sdk.NewAttribute("allowed_validators", strings.Join(msg.Params.AllowedValidators, ",")),
	))

	return &types.MsgUpdateParamsResponse{}, nil
}

// UpdateAdmin changes the PoA admin address. Only the current admin can call this.
func (ms msgServer) UpdateAdmin(ctx context.Context, msg *types.MsgUpdateAdmin) (*types.MsgUpdateAdminResponse, error) {
	params, err := ms.k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	if msg.Authority != params.Admin {
		return nil, types.ErrUnauthorized.Wrapf("only the current admin can change the admin; expected %s, got %s", params.Admin, msg.Authority)
	}

	if msg.NewAdmin == "" {
		return nil, types.ErrInvalidAdmin.Wrap("new admin address cannot be empty")
	}

	// ──────────────────────────────────────────────────────────────
	// FIX: Validate new admin is a valid bech32 address to prevent
	// irreversible transfer to an invalid/burned address.
	// ──────────────────────────────────────────────────────────────
	if _, err := sdk.AccAddressFromBech32(msg.NewAdmin); err != nil {
		return nil, types.ErrInvalidAdmin.Wrapf("invalid new admin address: %s", err)
	}

	oldAdmin := params.Admin
	params.Admin = msg.NewAdmin
	if err := ms.k.Params.Set(ctx, params); err != nil {
		return nil, err
	}

	// ──────────────────────────────────────────────────────────────
	// FIX: Emit event for auditability — UpdateAdmin
	// ──────────────────────────────────────────────────────────────
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	sdkCtx.EventManager().EmitEvent(sdk.NewEvent(
		"poa_admin_updated",
		sdk.NewAttribute("old_admin", oldAdmin),
		sdk.NewAttribute("new_admin", msg.NewAdmin),
	))

	return &types.MsgUpdateAdminResponse{}, nil
}

// UpdateAllowedValidators updates the list of allowed validator operator addresses.
// Only the current admin can call this.
func (ms msgServer) UpdateAllowedValidators(ctx context.Context, msg *types.MsgUpdateAllowedValidators) (*types.MsgUpdateAllowedValidatorsResponse, error) {
	params, err := ms.k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	if msg.Authority != params.Admin {
		return nil, types.ErrUnauthorized.Wrapf("only the admin can update allowed validators; expected %s, got %s", params.Admin, msg.Authority)
	}

	// ──────────────────────────────────────────────────────────────
	// FIX: Validate the new validator list before persisting to
	// prevent invalid addresses or duplicates from entering state.
	// ──────────────────────────────────────────────────────────────
	updatedParams := types.Params{
		Admin:             params.Admin,
		AllowedValidators: msg.AllowedValidators,
	}
	if err := updatedParams.Validate(); err != nil {
		return nil, err
	}

	oldValidators := strings.Join(params.AllowedValidators, ",")
	params.AllowedValidators = msg.AllowedValidators
	if err := ms.k.Params.Set(ctx, params); err != nil {
		return nil, err
	}

	// ──────────────────────────────────────────────────────────────
	// FIX: Emit event for auditability — UpdateAllowedValidators
	// ──────────────────────────────────────────────────────────────
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	sdkCtx.EventManager().EmitEvent(sdk.NewEvent(
		"poa_allowed_validators_updated",
		sdk.NewAttribute("authority", msg.Authority),
		sdk.NewAttribute("old_validators", oldValidators),
		sdk.NewAttribute("new_validators", strings.Join(msg.AllowedValidators, ",")),
	))

	return &types.MsgUpdateAllowedValidatorsResponse{}, nil
}
