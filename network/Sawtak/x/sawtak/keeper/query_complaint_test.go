package keeper_test

import (
	"context"
	"strconv"
	"testing"

	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
	"github.com/cosmos/cosmos-sdk/types/query"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/sayedibrahimQ/sawtak/x/sawtak/keeper"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

func createNComplaint(keeper keeper.Keeper, ctx context.Context, n int) []types.Complaint {
	items := make([]types.Complaint, n)
	for i := range items {
		iu := uint64(i)
		items[i].Id = iu
		items[i].TrackingId = strconv.Itoa(i)
		items[i].ComplaintType = strconv.Itoa(i)
		items[i].Title = strconv.Itoa(i)
		items[i].Text = strconv.Itoa(i)
		items[i].Category = strconv.Itoa(i)
		items[i].Area = strconv.Itoa(i)
		items[i].DirectedTo = strconv.Itoa(i)
		items[i].IncidentDate = strconv.Itoa(i)
		items[i].Evidence = strconv.Itoa(i)
		items[i].Status = strconv.Itoa(i)
		_ = keeper.Complaint.Set(ctx, iu, items[i])
		_ = keeper.ComplaintSeq.Set(ctx, iu)
	}
	return items
}

func TestComplaintQuerySingle(t *testing.T) {
	f := initFixture(t)
	qs := keeper.NewQueryServerImpl(f.keeper)
	msgs := createNComplaint(f.keeper, f.ctx, 2)
	tests := []struct {
		desc     string
		request  *types.QueryGetComplaintRequest
		response *types.QueryGetComplaintResponse
		err      error
	}{
		{
			desc:     "First",
			request:  &types.QueryGetComplaintRequest{Id: msgs[0].Id},
			response: &types.QueryGetComplaintResponse{Complaint: msgs[0]},
		},
		{
			desc:     "Second",
			request:  &types.QueryGetComplaintRequest{Id: msgs[1].Id},
			response: &types.QueryGetComplaintResponse{Complaint: msgs[1]},
		},
		{
			desc:    "KeyNotFound",
			request: &types.QueryGetComplaintRequest{Id: uint64(len(msgs))},
			err:     sdkerrors.ErrKeyNotFound,
		},
		{
			desc: "InvalidRequest",
			err:  status.Error(codes.InvalidArgument, "invalid request"),
		},
	}
	for _, tc := range tests {
		t.Run(tc.desc, func(t *testing.T) {
			response, err := qs.GetComplaint(f.ctx, tc.request)
			if tc.err != nil {
				require.ErrorIs(t, err, tc.err)
			} else {
				require.NoError(t, err)
				require.EqualExportedValues(t, tc.response, response)
			}
		})
	}
}

func TestComplaintQueryPaginated(t *testing.T) {
	f := initFixture(t)
	qs := keeper.NewQueryServerImpl(f.keeper)
	msgs := createNComplaint(f.keeper, f.ctx, 5)

	request := func(next []byte, offset, limit uint64, total bool) *types.QueryAllComplaintRequest {
		return &types.QueryAllComplaintRequest{
			Pagination: &query.PageRequest{
				Key:        next,
				Offset:     offset,
				Limit:      limit,
				CountTotal: total,
			},
		}
	}
	t.Run("ByOffset", func(t *testing.T) {
		step := 2
		for i := 0; i < len(msgs); i += step {
			resp, err := qs.ListComplaint(f.ctx, request(nil, uint64(i), uint64(step), false))
			require.NoError(t, err)
			require.LessOrEqual(t, len(resp.Complaint), step)
			require.Subset(t, msgs, resp.Complaint)
		}
	})
	t.Run("ByKey", func(t *testing.T) {
		step := 2
		var next []byte
		for i := 0; i < len(msgs); i += step {
			resp, err := qs.ListComplaint(f.ctx, request(next, 0, uint64(step), false))
			require.NoError(t, err)
			require.LessOrEqual(t, len(resp.Complaint), step)
			require.Subset(t, msgs, resp.Complaint)
			next = resp.Pagination.NextKey
		}
	})
	t.Run("Total", func(t *testing.T) {
		resp, err := qs.ListComplaint(f.ctx, request(nil, 0, 0, true))
		require.NoError(t, err)
		require.Equal(t, len(msgs), int(resp.Pagination.Total))
		require.EqualExportedValues(t, msgs, resp.Complaint)
	})
	t.Run("InvalidRequest", func(t *testing.T) {
		_, err := qs.ListComplaint(f.ctx, nil)
		require.ErrorIs(t, err, status.Error(codes.InvalidArgument, "invalid request"))
	})
}
