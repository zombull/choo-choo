package interactive

import (
	"github.com/zombull/choo-choo/bug"
	"github.com/zombull/choo-choo/customs"
	"github.com/zombull/choo-choo/database"
	"github.com/zombull/choo-choo/server"
)

func import_(d *database.Database) {
	ac := newMapAutocompleter(customs.ImportTypes)
	l := newReader("Import Type: ", ac)
	doReadline(l, true, func(line string) string {
		if f, ok := customs.ImportTypes[line]; ok {
			f(d, getFiles(line))
			return line
		}
		return ""
	})
}

var xx struct{}

func export(d *database.Database, s *server.Server) {
	m := database.Set{
		"server": xx,
		"file":   xx,
	}

	t := getSet(m, "Export To")
	if t == "server" {
		s.Update(d)
	} else {
		bug.On(true, "file not yet implemented")
	}
}
