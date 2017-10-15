package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/zombull/choo-choo/bug"
	"github.com/zombull/choo-choo/database"
	"github.com/zombull/choo-choo/interactive"
	"github.com/zombull/choo-choo/moonboard"
	"github.com/zombull/choo-choo/server"
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

	switch len(os.Args) {
	case 1:
		interactive.Run(d)
	case 2:
		bug.On(os.Args[1] != "-s", fmt.Sprintf("Invalid command line: %v", os.Args))
		server.Run("")
	case 3:
		bug.On(os.Args[1] != "-s", fmt.Sprintf("Invalid command line: %v", os.Args))
		port, err := strconv.Atoi(os.Args[2])
		bug.On(port <= 0 || err != nil, fmt.Sprintf("Invalid command line: %v", os.Args))
		server.Run(":" + os.Args[2])
	}
}
