package ante

import (
	"errors"
	"strings"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/x/authz"
	slashingtypes "github.com/cosmos/cosmos-sdk/x/slashing/types"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"

	"github.com/sayedibrahimQ/sawtak/x/poa/keeper"
	"github.com/sayedibrahimQ/sawtak/x/poa/types"
)

// stakingMsgTypeURLs is the set of staking/slashing message type URLs that
// the PoA module restricts. Used to block authz grants for these message types.
var stakingMsgTypeURLs = map[string]bool{
	sdk.MsgTypeURL(&stakingtypes.MsgCreateValidator{}):           true,
	sdk.MsgTypeURL(&stakingtypes.MsgEditValidator{}):             true,
	sdk.MsgTypeURL(&stakingtypes.MsgDelegate{}):                  true,
	sdk.MsgTypeURL(&stakingtypes.MsgUndelegate{}):                true,
	sdk.MsgTypeURL(&stakingtypes.MsgBeginRedelegate{}):           true,
	sdk.MsgTypeURL(&stakingtypes.MsgCancelUnbondingDelegation{}): true,
	sdk.MsgTypeURL(&slashingtypes.MsgUnjail{}):                   true,
}

// isStakingTypeURL returns true if the given type URL corresponds to a
// staking/slashing message that the PoA module restricts.
func isStakingTypeURL(typeURL string) bool {
	// Direct lookup first
	if stakingMsgTypeURLs[typeURL] {
		return true
	}
	// Fallback: check if the type URL contains known staking message names.
	// This catches generic authorizations like "/cosmos.staking.v1beta1.MsgDelegate".
	stakingPrefixes := []string{
		"/cosmos.staking.",
		"/cosmos.slashing.",
	}
	for _, prefix := range stakingPrefixes {
		if strings.HasPrefix(typeURL, prefix) {
			return true
		}
	}
	return false
}

// PoaDecorator enforces Proof of Authority rules by intercepting staking-related
// messages and blocking them unless they come from the PoA admin or an allowed validator.
type PoaDecorator struct {
	poaKeeper keeper.Keeper
}

// NewPoaDecorator creates a new PoaDecorator.
func NewPoaDecorator(poaKeeper keeper.Keeper) PoaDecorator {
	return PoaDecorator{
		poaKeeper: poaKeeper,
	}
}

// AnteHandle checks staking messages against PoA rules.
func (pd PoaDecorator) AnteHandle(ctx sdk.Context, tx sdk.Tx, simulate bool, next sdk.AnteHandler) (sdk.Context, error) {
	// During simulation or deliverTx, enforce PoA rules
	params, err := pd.poaKeeper.Params.Get(ctx)
	if err != nil {
		// If params are not set yet (e.g. during init), allow the transaction.
		// This handles the case where genesis transactions run before InitGenesis.
		if errors.Is(err, collections.ErrNotFound) {
			return next(ctx, tx, simulate)
		}
		return ctx, err
	}

	// If no admin is configured, allow everything (PoA is not active)
	if params.Admin == "" {
		return next(ctx, tx, simulate)
	}

	for _, msg := range tx.GetMsgs() {
		if err := pd.checkMsg(ctx, msg, params); err != nil {
			return ctx, err
		}
	}

	return next(ctx, tx, simulate)
}

// checkMsg inspects a single message and enforces PoA rules.
// It recursively inspects messages wrapped inside authz.MsgExec.
func (pd PoaDecorator) checkMsg(_ sdk.Context, msg sdk.Msg, params types.Params) error {
	switch msg := msg.(type) {

	// ──────────────────────────────────────────────────────────────
	// CRITICAL FIX: Authz MsgExec bypass prevention
	// Without this, an attacker can wrap restricted staking messages
	// inside MsgExec to completely circumvent PoA enforcement.
	// ──────────────────────────────────────────────────────────────
	case *authz.MsgExec:
		// Decode inner messages and check each one recursively
		innerMsgs, err := msg.GetMessages()
		if err != nil {
			return types.ErrStakingActionBlocked.Wrapf(
				"failed to unpack authz MsgExec inner messages: %s", err,
			)
		}
		for _, innerMsg := range innerMsgs {
			if err := pd.checkMsg(sdk.Context{}, innerMsg, params); err != nil {
				return types.ErrStakingActionBlocked.Wrapf(
					"authz MsgExec contains blocked message: %s", err,
				)
			}
		}

	// ──────────────────────────────────────────────────────────────
	// CRITICAL FIX: Block authz grants for staking message types
	// from non-admin accounts. Without this, anyone could grant
	// staking authorizations that bypass PoA enforcement.
	// ──────────────────────────────────────────────────────────────
	case *authz.MsgGrant:
		if msg.Granter != params.Admin {
			grant := msg.Grant
			if grant.Authorization != nil {
				typeURL := grant.Authorization.TypeUrl
				if isStakingTypeURL(typeURL) {
					return types.ErrStakingActionBlocked.Wrapf(
						"MsgGrant for staking type %s from non-admin %s is blocked",
						typeURL, msg.Granter,
					)
				}
			}
		}

	// ──── Staking message enforcement ────

	case *stakingtypes.MsgCreateValidator:
		// Only allow if the delegator (who is also the validator operator) is the admin
		// OR is in the allowed validators list
		if msg.DelegatorAddress != params.Admin && !pd.poaKeeper.IsAllowedValidator(msg.DelegatorAddress, params) {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgCreateValidator from %s is not allowed; must be admin (%s) or an allowed validator",
				msg.DelegatorAddress, params.Admin,
			)
		}

	case *stakingtypes.MsgEditValidator:
		// Only allow if the validator address is the admin or an allowed validator
		if msg.ValidatorAddress != params.Admin && !pd.poaKeeper.IsAllowedValidator(msg.ValidatorAddress, params) {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgEditValidator from %s is not allowed",
				msg.ValidatorAddress,
			)
		}

	case *stakingtypes.MsgDelegate:
		// Block delegation from non-admin accounts
		if msg.DelegatorAddress != params.Admin {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgDelegate from %s is blocked; only admin (%s) can delegate in PoA mode",
				msg.DelegatorAddress, params.Admin,
			)
		}

	case *stakingtypes.MsgUndelegate:
		// Block undelegation from non-admin accounts
		if msg.DelegatorAddress != params.Admin {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgUndelegate from %s is blocked; only admin (%s) can undelegate in PoA mode",
				msg.DelegatorAddress, params.Admin,
			)
		}

	case *stakingtypes.MsgBeginRedelegate:
		// Block redelegation from non-admin accounts
		if msg.DelegatorAddress != params.Admin {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgBeginRedelegate from %s is blocked; only admin (%s) can redelegate in PoA mode",
				msg.DelegatorAddress, params.Admin,
			)
		}

	// ──────────────────────────────────────────────────────────────
	// CRITICAL FIX: Missing MsgCancelUnbondingDelegation interception
	// Without this, any user could cancel an unbonding delegation
	// without being admin, bypassing PoA control over staking.
	// ──────────────────────────────────────────────────────────────
	case *stakingtypes.MsgCancelUnbondingDelegation:
		if msg.DelegatorAddress != params.Admin {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgCancelUnbondingDelegation from %s is blocked; only admin (%s) can cancel unbonding",
				msg.DelegatorAddress, params.Admin,
			)
		}

	case *slashingtypes.MsgUnjail:
		// Only allow unjailing if the validator is the admin or an explicitly allowed validator.
		// If a node goes offline, they need this to recover their consensus power!
		if msg.ValidatorAddr != params.Admin && !pd.poaKeeper.IsAllowedValidator(msg.ValidatorAddr, params) {
			return types.ErrStakingActionBlocked.Wrapf(
				"MsgUnjail from %s is not allowed; must be admin or an allowed validator",
				msg.ValidatorAddr,
			)
		}
	}

	return nil
}
