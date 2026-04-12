package ante

import (
	"errors"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"
	slashingtypes "github.com/cosmos/cosmos-sdk/x/slashing/types"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"

	"github.com/sayedibrahimQ/sawtak/x/poa/keeper"
	"github.com/sayedibrahimQ/sawtak/x/poa/types"
)

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
func (pd PoaDecorator) checkMsg(_ sdk.Context, msg sdk.Msg, params types.Params) error {
	switch msg := msg.(type) {
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
