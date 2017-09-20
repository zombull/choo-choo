package interactive

import (
	"fmt"
	"strings"

	"github.com/zombull/choo-choo/database"
	"github.com/zombull/choo-choo/moonboard"
)

type addOp struct {
}

func (a *addOp) name() string {
	return "Add"
}

func (a *addOp) crag(d *database.Database, p string) {
	c := &database.Crag{
		Name:     getString(strings.Title(p)+" Name", false),
		Location: getString("Location", false),
		Url:      getUrl("URL"),
		Map:      getUrl("Map (url)"),
		Comment:  getComment(),
	}
	d.Insert(c)
}

func (a *addOp) area(d *database.Database, p string) {
	area := &database.Area{
		Name:    getString(strings.Title(p)+" Name", false),
		CragId:  getCrag(d).Id,
		Url:     getUrl("URL"),
		Map:     getUrl("Map (url)"),
		Comment: getComment(),
	}
	d.Insert(area)
}

func (a *addOp) setter(d *database.Database) {
	s := &database.Setter{
		CragId:   getCrag(d).Id,
		Name:     getString("Setter Name", false),
		Inactive: getBool("Inactive"),
		Comment:  getComment(),
	}
	d.Insert(s)
}

func (a *addOp) route(d *database.Database) {
	a.newRoute(d, nil)
}

func (a *addOp) newRoute(d *database.Database, crag *database.Crag) *database.Route {
	var r *database.Route
	if crag != nil && crag.Name == moonboard.Name {
		r = a.newMoonbooardProblem(d)
	} else {
		r = &database.Route{
			Name: getString("Route Name", false),
			Type: getType(d),
		}
	}
	if r.Type == "boulder" || r.Type == "moonboard" {
		r.Grade = getVGrade()
	} else {
		r.Grade = getYdsGrade()
		r.Pitches = getUint("Pitches")
	}

	var setter string
	if r.Type != "moonboard" {
		if crag == nil {
			crag = getCrag(d)
		}
		r.CragId = crag.Id
		r.AreaId = getArea(d, crag).Id
		r.Length = getUint("Length (feet)")
		if s := getSetter(d, crag); s != nil {
			r.SetterId = s.Id
			setter = s.Name
		}
	}

	r.Stars = getStars()
	if len(r.Url) == 0 {
		r.Url = getUrl("URL")
	}
	r.Comment = getComment()

	if r.Type == "moonboard" {
		moonboard.InsertProblem(d, r)
	} else {
		d.Insert(r)
	}
	fmt.Printf("Added Route"+database.FORMAT_ROUTE, r.Name, r.Type, r.Grade, r.Stars, r.Length, r.Pitches, setter, r.Url, r.Comment)
	return r
}

func (a *addOp) newMoonbooardProblem(d *database.Database) *database.Route {
	crag := d.GetCrag(moonboard.Id(d))
	area := getArea(d, crag)
retry:
	name, url := queryMoonboardName()
	r := d.FindRoute(area.Id, name)
	if r != nil {
		fmt.Printf("Moonboard problem '%s' already exists in the database", name)
		goto retry
	}
	return &database.Route{
		Name:   name,
		Type:   "moonboard",
		Url:    url,
		CragId: crag.Id,
		AreaId: area.Id,
	}
}

func (a *addOp) tick(d *database.Database) {
	c := getCrag(d)
	r := getRoute(d, c, nil)
	if r == nil {
		r = a.newRoute(d, c)
	}

	t := database.Tick{
		RouteId: r.Id,
		AreaId:  r.AreaId,
		CragId:  r.CragId,
		Date:    getDate(),
	}
	if r.Type == "boulder" || r.Type == "moonboard" {
		t.Redpoint = true
		t.Attempts = getUint("Attempts")
	} else {
		t.Lead = getBool("Lead")
		t.Redpoint = getBool("Redpoint")
	}

	if t.Redpoint {
		if t.Attempts == 1 {
			if r.Type == "sport" || r.Type == "trade" {
				t.Onsight = getBool("Onsight")
			}
			if !t.Onsight {
				t.Flash = getBool("Flash")
			}
		} else {
			t.Sessions = getUint("Sessions")
		}
	} else {
		t.Falls = getUint("Falls")
		t.Hangs = getUint("Hangs")
	}
	t.Comment = getComment()
	d.Insert(&t)

	fmt.Printf("Added Tick"+database.FORMAT_TICK, r.Name, t.Date.Format("January 02, 2006"), t.Redpoint, t.Flash, t.Onsight, t.Falls, t.Hangs, t.Attempts, t.Sessions, t.Url, t.Comment)
}

func (a *addOp) list(d *database.Database) {

}

func queryMoonboardName() (string, string) {
	for {
		s := getString("Moonboard Query", false)
		m := moonboard.QueryProblems(s)
		if len(m) == 0 {
			fmt.Printf("Did not find any Moonboard problems matching '%s'\n", s)
			continue
		}

		ac := newMapAutocompleter(m)
		l := newReader("Select Problem: ", ac)
		url := ""
		name := doReadline(l, true, func(line string) string {
			if v, ok := m[line]; ok {
				url = v
				return line
			}
			fmt.Println("Select a problem or hit Ctrl+C to cancel")
			return ""
		})
		if name != "" {
			return name, url
		}
	}
}
