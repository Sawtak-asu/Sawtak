package types

import "fmt"

// DefaultGenesis returns the default genesis state
func DefaultGenesis() *GenesisState {
	return &GenesisState{
		Params:        DefaultParams(),
		ComplaintList: []Complaint{}}
}

// Validate performs basic genesis state validation returning an error upon any
// failure.
func (gs GenesisState) Validate() error {
	complaintIdMap := make(map[uint64]bool)
	complaintCount := gs.GetComplaintCount()
	for _, elem := range gs.ComplaintList {
		if _, ok := complaintIdMap[elem.Id]; ok {
			return fmt.Errorf("duplicated id for complaint")
		}
		if elem.Id >= complaintCount {
			return fmt.Errorf("complaint id should be lower or equal than the last id")
		}
		complaintIdMap[elem.Id] = true
	}

	return gs.Params.Validate()
}
