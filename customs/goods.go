package customs

import (
	"fmt"
	"os"

	"github.com/zombull/floating-castle/bug"
	"github.com/zombull/floating-castle/database"
	"github.com/zombull/floating-castle/moonboard"
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
