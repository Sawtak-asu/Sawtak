package sawtak

import (
	autocliv1 "cosmossdk.io/api/cosmos/autocli/v1"

	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
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
					Short:     "Shows the parameters of the module",
				},
				{
					RpcMethod: "ListComplaint",
					Use:       "list-complaint",
					Short:     "List all complaint",
				},
				{
					RpcMethod:      "GetComplaint",
					Use:            "get-complaint [id]",
					Short:          "Gets a complaint by id",
					Alias:          []string{"show-complaint"},
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "id"}},
				},
				{
					RpcMethod: "FilterComplaints",
					Use:       "filter-complaints",
					Short:     "Query complaints filtered by status, area, and/or category",
					FlagOptions: map[string]*autocliv1.FlagOptions{
						"status":   {Name: "status", Usage: "filter by complaint status (e.g. pending, resolved)"},
						"area":     {Name: "area", Usage: "filter by complaint area"},
						"category": {Name: "category", Usage: "filter by complaint category"},
					},
				},
			},
		},
		Tx: &autocliv1.ServiceCommandDescriptor{
			Service:              types.Msg_serviceDesc.ServiceName,
			EnhanceCustomCommand: true, // only required if you want to use the custom command
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "UpdateParams",
					Skip:      true, // skipped because authority gated
				},
				{
					RpcMethod:      "SubmitIdentifiedComplaint",
					Use:            "submit-identified-complaint [tracking-id] [title] [text] [category] [area] [directed-to] [incident-date] [evidence]",
					Short:          "Send a submitIdentifiedComplaint tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "tracking_id"}, {ProtoField: "title"}, {ProtoField: "text"}, {ProtoField: "category"}, {ProtoField: "area"}, {ProtoField: "directed_to"}, {ProtoField: "incident_date"}, {ProtoField: "evidence"}},
				},
				{
					RpcMethod:      "SubmitAnonymousComplaint",
					Use:            "submit-anonymous-complaint [tracking_id] [anonymous_identifier] [title] [text] [category] [area] [directed_to] [incident_date] [evidence] [proof]",
					Short:          "Send a submitAnonymousComplaint tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "tracking_id"}, {ProtoField: "anonymous_identifier"}, {ProtoField: "title"}, {ProtoField: "text"}, {ProtoField: "category"}, {ProtoField: "area"}, {ProtoField: "directed_to"}, {ProtoField: "incident_date"}, {ProtoField: "evidence"}, {ProtoField: "proof"}},
				},
				{
					RpcMethod:      "UpdateComplaintStatus",
					Use:            "update-complaint-status [complaint-id] [old-status] [new-status] [public-notes]",
					Short:          "Send a updateComplaintStatus tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "complaint_id"}, {ProtoField: "old_status"}, {ProtoField: "new_status"}, {ProtoField: "public_notes"}},
				},
			},
		},
	}
}
