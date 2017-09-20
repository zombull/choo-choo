package main

import (
	"fmt"
	"os"

	"github.com/zombull/choo-choo/database"
	"github.com/zombull/choo-choo/interactive"
	"github.com/zombull/choo-choo/moonboard"
)

func main() {
	printError := func(err error) {
		fmt.Fprintf(os.Stderr, "\n%s\n", err)
		os.Exit(1)
	}

	c, err := loadConfig()
	if err != nil {
		printError(err)
	}

	d, err := database.Init(c.Database)
	if err != nil {
		printError(err)
	}

	moonboard.Init(d, c.MoonboardSet, c.MoonboardUser)

	interactive.Run(d)
}
