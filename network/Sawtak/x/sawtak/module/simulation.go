package sawtak

import (
	"math/rand"

	"github.com/cosmos/cosmos-sdk/types/module"
	simtypes "github.com/cosmos/cosmos-sdk/types/simulation"
	"github.com/cosmos/cosmos-sdk/x/simulation"

	sawtaksimulation "github.com/sayedibrahimQ/sawtak/x/sawtak/simulation"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

// GenerateGenesisState creates a randomized GenState of the module.
func (AppModule) GenerateGenesisState(simState *module.SimulationState) {
	accs := make([]string, len(simState.Accounts))
	for i, acc := range simState.Accounts {
		accs[i] = acc.Address.String()
	}
	sawtakGenesis := types.GenesisState{
		Params: types.DefaultParams(),
	}
	simState.GenState[types.ModuleName] = simState.Cdc.MustMarshalJSON(&sawtakGenesis)
}

// RegisterStoreDecoder registers a decoder.
func (am AppModule) RegisterStoreDecoder(_ simtypes.StoreDecoderRegistry) {}

// WeightedOperations returns the all the gov module operations with their respective weights.
func (am AppModule) WeightedOperations(simState module.SimulationState) []simtypes.WeightedOperation {
	operations := make([]simtypes.WeightedOperation, 0)
	const (
		opWeightMsgSubmitIdentifiedComplaint          = "op_weight_msg_sawtak"
		defaultWeightMsgSubmitIdentifiedComplaint int = 100
	)

	var weightMsgSubmitIdentifiedComplaint int
	simState.AppParams.GetOrGenerate(opWeightMsgSubmitIdentifiedComplaint, &weightMsgSubmitIdentifiedComplaint, nil,
		func(_ *rand.Rand) {
			weightMsgSubmitIdentifiedComplaint = defaultWeightMsgSubmitIdentifiedComplaint
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgSubmitIdentifiedComplaint,
		sawtaksimulation.SimulateMsgSubmitIdentifiedComplaint(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgSubmitAnonymousComplaint          = "op_weight_msg_sawtak"
		defaultWeightMsgSubmitAnonymousComplaint int = 100
	)

	var weightMsgSubmitAnonymousComplaint int
	simState.AppParams.GetOrGenerate(opWeightMsgSubmitAnonymousComplaint, &weightMsgSubmitAnonymousComplaint, nil,
		func(_ *rand.Rand) {
			weightMsgSubmitAnonymousComplaint = defaultWeightMsgSubmitAnonymousComplaint
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgSubmitAnonymousComplaint,
		sawtaksimulation.SimulateMsgSubmitAnonymousComplaint(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgUpdateComplaintStatus          = "op_weight_msg_sawtak"
		defaultWeightMsgUpdateComplaintStatus int = 100
	)

	var weightMsgUpdateComplaintStatus int
	simState.AppParams.GetOrGenerate(opWeightMsgUpdateComplaintStatus, &weightMsgUpdateComplaintStatus, nil,
		func(_ *rand.Rand) {
			weightMsgUpdateComplaintStatus = defaultWeightMsgUpdateComplaintStatus
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgUpdateComplaintStatus,
		sawtaksimulation.SimulateMsgUpdateComplaintStatus(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))

	return operations
}

// ProposalMsgs returns msgs used for governance proposals for simulations.
func (am AppModule) ProposalMsgs(simState module.SimulationState) []simtypes.WeightedProposalMsg {
	return []simtypes.WeightedProposalMsg{}
}
