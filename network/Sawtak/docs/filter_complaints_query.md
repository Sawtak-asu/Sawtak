# FilterComplaints Query — Integration Guide

## Overview

The `FilterComplaints` query lets you retrieve complaints filtered by **status**, **area**, and/or **category**. All filters are optional — omit a field to match all values for that dimension.

---

## Endpoints

| Method | Endpoint |
|---|---|
| **REST** | `GET /sawtak/v1/complaint/filter?status=X&area=Y&category=Z` |
| **gRPC** | `sawtak.sawtak.v1.Query/FilterComplaints` |
| **CLI** | `sawtakd q sawtak filter-complaints --status X --area Y --category Z` |

---

## REST API

### Request

```
GET /sawtak/v1/complaint/filter
```

**Query Parameters** (all optional):

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status (e.g. `pending`, `resolved`, `rejected`) |
| `area` | string | Filter by area (e.g. `Doha`, `Al Wakrah`) |
| `category` | string | Filter by category (e.g. `infrastructure`, `corruption`) |

### Examples

```bash
# All pending complaints
curl http://localhost:1317/sawtak/v1/complaint/filter?status=pending

# All complaints in Doha
curl http://localhost:1317/sawtak/v1/complaint/filter?area=Doha

# Pending infrastructure complaints in Doha
curl "http://localhost:1317/sawtak/v1/complaint/filter?status=pending&area=Doha&category=infrastructure"

# No filters = returns ALL complaints
curl http://localhost:1317/sawtak/v1/complaint/filter
```

### Response

```json
{
  "complaints": [
    {
      "id": "1",
      "tracking_id": "TRK-001",
      "anonymous_identifier": "",
      "complaint_type": "identified",
      "title": "Road damage",
      "text": "Large pothole on main street",
      "category": "infrastructure",
      "area": "Doha",
      "directed_to": "municipality",
      "incident_date": "2026-04-15",
      "evidence": "ipfs://Qm...",
      "status": "pending"
    }
  ]
}
```

---

## CLI

```bash
# By status
sawtakd q sawtak filter-complaints --status pending

# By area + category
sawtakd q sawtak filter-complaints --area Doha --category infrastructure

# All filters combined
sawtakd q sawtak filter-complaints --status pending --area Doha --category corruption
```

---

## gRPC (Go Client)

```go
import (
    "context"
    sawtaktypes "github.com/sayedibrahimQ/sawtak/x/sawtak/types"
)

resp, err := queryClient.FilterComplaints(context.Background(), &sawtaktypes.QueryFilterComplaintsRequest{
    Status:   "pending",
    Area:     "Doha",
    Category: "",  // empty = match all categories
})
// resp.Complaints contains the filtered list
```

---

## Backend Integration (Python/JS)

```python
import requests

BASE = "http://localhost:1317"

# Filter by status
r = requests.get(f"{BASE}/sawtak/v1/complaint/filter", params={"status": "pending"})
complaints = r.json()["complaints"]
```

```javascript
const res = await fetch(`http://localhost:1317/sawtak/v1/complaint/filter?status=pending&area=Doha`);
const { complaints } = await res.json();
```

---

## Source Files

| File | Purpose |
|---|---|
| `proto/sawtak/sawtak/v1/query.proto` | RPC + message definitions |
| `x/sawtak/keeper/query_filter_complaints.go` | Filter logic implementation |
| `x/sawtak/module/autocli.go` | CLI command registration |
