package customs

import (
	"fmt"
	"os"

	"github.com/zombull/choo-choo/bug"
	"github.com/zombull/choo-choo/database"
	"github.com/zombull/choo-choo/moonboard"
)

var ImportTypes = map[string]func(d *database.Database, files []string){
	"gym":       ImportGym,
	"set":       ImportGymSet,
	"moonboard": ImportMoonboard,
}

func ImportMoonboard(d *database.Database, files []string) {
	for _, file := range files {
		fmt.Printf("Importing Moonboard from '%s'\n", file)

		f, err := os.Open(file)
		bug.UserError(err)
		moonboard.SyncIndex(d, f)
	}
}
