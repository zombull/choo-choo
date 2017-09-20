package database

type Holds struct {
	RouteId int64             `yaml:"-"`
	Holds   map[string]string `yaml:"holds"`
}

var HoldKeys = []string{
	"route_id",
	"start_1",
	"start_2",
	"intermediate_1",
	"intermediate_2",
	"intermediate_3",
	"intermediate_4",
	"intermediate_5",
	"intermediate_6",
	"intermediate_7",
	"intermediate_8",
	"intermediate_9",
	"intermediate_10",
	"intermediate_11",
	"intermediate_12",
	"intermediate_13",
	"intermediate_14",
	"intermediate_15",
	"intermediate_16",
	"intermediate_17",
	"intermediate_18",
	"intermediate_19",
	"intermediate_20",
	"finish_one",
	"finish_two",
}

const HOLDS_SCHEMA = `
CREATE TABLE IF NOT EXISTS holds (
	route_id INTEGER PRIMARY KEY,
	start_1 TEXT NOT NULL,
	start_2 TEXT,
	intermediate_1 TEXT,
	intermediate_2 TEXT,
	intermediate_3 TEXT,
	intermediate_4 TEXT,
	intermediate_5 TEXT,
	intermediate_6 TEXT,
	intermediate_7 TEXT,
	intermediate_8 TEXT,
	intermediate_9 TEXT,
	intermediate_10 TEXT,
	intermediate_11 TEXT,
	intermediate_12 TEXT,
	intermediate_13 TEXT,
	intermediate_14 TEXT,
	intermediate_15 TEXT,
	intermediate_16 TEXT,
	intermediate_17 TEXT,
	intermediate_18 TEXT,
	intermediate_19 TEXT,
	intermediate_20 TEXT,
	finish_one TEXT NOT NULL,
	finish_two TEXT,
	FOREIGN KEY (route_id) REFERENCES routes (id)
);`

func (h *Holds) id() int64 {
	return h.RouteId
}

func (h *Holds) setSideOneId(id int64) {
	h.RouteId = id
}

func (h *Holds) setId(id int64) {
	h.RouteId = id
}

func (h *Holds) table() string {
	return "holds"
}

func (h *Holds) keys() []string {
	return HoldKeys
}

func (h *Holds) values() []interface{} {
	values := make([]interface{}, len(HoldKeys))
	for i, k := range HoldKeys {
		if i == 0 {
			values[i] = h.RouteId
		} else {
			values[i] = h.Holds[k]
		}
	}
	return values
}
