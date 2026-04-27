package poa

import (
	autocliv1 "cosmossdk.io/api/cosmos/autocli/v1"

	"github.com/sayedibrahimQ/sawtak/x/poa/types"
)

// AutoCLIOptions implements the autocli.HasAutoCLIConfig interface.
func (am AppModule) AutoCLIOptions() *autocliv1.ModuleOptions {
	return &autocliv1.ModuleOptions{
		Query: &autocliv1.ServiceCommandDescriptor{
			Service: types.Query_serviceDesc.ServiceName,
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "Params",
					Use:       "params",
					Short:     "Shows the parameters of the PoA module (admin, allowed validators)",
				},
			},
		},
		Tx: &autocliv1.ServiceCommandDescriptor{
			Service:              types.Msg_serviceDesc.ServiceName,
			EnhanceCustomCommand: true,
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "UpdateParams",
					Skip:      true, // skipped because authority gated
				},
				{
					RpcMethod:      "UpdateAdmin",
					Use:            "update-admin [new-admin-address]",
					Short:          "Update the PoA admin address (admin only)",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "new_admin"}},
				},
				{
					RpcMethod: "UpdateAllowedValidators",
					Use:       "update-allowed-validators [addr1,addr2,...]",
					Short:     "Update the list of allowed validator operator addresses (admin only)",
				},
			},
		},
	}
}
