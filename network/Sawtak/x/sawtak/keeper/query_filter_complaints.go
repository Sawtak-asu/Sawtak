package keeper

import (
	"context"

	"github.com/sayedibrahimQ/sawtak/x/sawtak/types"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// FilterComplaints iterates all complaints and returns those matching the given
// status, area, and/or category filters. Empty filter values are treated as
// wildcards (match everything).
func (q queryServer) FilterComplaints(ctx context.Context, req *types.QueryFilterComplaintsRequest) (*types.QueryFilterComplaintsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	// Iterate over every complaint in the store
	iter, err := q.k.Complaint.Iterate(ctx, nil)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	defer iter.Close()

	var filtered []types.Complaint
	for ; iter.Valid(); iter.Next() {
		kv, err := iter.KeyValue()
		if err != nil {
			return nil, status.Error(codes.Internal, err.Error())
		}
		complaint := kv.Value

		// Apply filters — only non-empty request fields are used as criteria
		if req.Status != "" && complaint.Status != req.Status {
			continue
		}
		if req.Area != "" && complaint.Area != req.Area {
			continue
		}
		if req.Category != "" && complaint.Category != req.Category {
			continue
		}

		filtered = append(filtered, complaint)
	}

	return &types.QueryFilterComplaintsResponse{Complaints: filtered}, nil
}
