package keeper

import (
	"context"
	"errors"

	"cosmossdk.io/collections"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
	"github.com/cosmos/cosmos-sdk/types/query"
	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (q queryServer) ListComplaint(ctx context.Context, req *types.QueryAllComplaintRequest) (*types.QueryAllComplaintResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	complaints, pageRes, err := query.CollectionPaginate(
		ctx,
		q.k.Complaint,
		req.Pagination,
		func(_ uint64, value types.Complaint) (types.Complaint, error) {
			return value, nil
		},
	)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &types.QueryAllComplaintResponse{Complaint: complaints, Pagination: pageRes}, nil
}

func (q queryServer) GetComplaint(ctx context.Context, req *types.QueryGetComplaintRequest) (*types.QueryGetComplaintResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	complaint, err := q.k.Complaint.Get(ctx, req.Id)
	if err != nil {
		if errors.Is(err, collections.ErrNotFound) {
			return nil, sdkerrors.ErrKeyNotFound
		}

		return nil, status.Error(codes.Internal, "internal error")
	}

	return &types.QueryGetComplaintResponse{Complaint: complaint}, nil
}
