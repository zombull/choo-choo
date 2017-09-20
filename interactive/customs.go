package interactive

import (
	"github.com/zombull/choo-choo/customs"
	"github.com/zombull/choo-choo/database"
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

func export(d *database.Database) {

}
