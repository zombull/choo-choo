package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/zombull/floating-castle/bug"
	"github.com/zombull/floating-castle/database"
	"github.com/zombull/floating-castle/interactive"
	"github.com/zombull/floating-castle/moonboard"
	"github.com/zombull/floating-castle/server"
)

func main() {
	c := loadConfig()

	d := database.Init(c.Database)

	moonboard.Init(d, c.MoonboardSet, c.MoonboardUser)

	s := server.Init(c.Server)

	switch len(os.Args) {
	case 1:
		interactive.Run(d, s)
	case 2:
		if os.Args[1] == "-u" {
			s.Update(d)
		} else {
			bug.On(os.Args[1] != "-s", fmt.Sprintf("Invalid command line: %v", os.Args))
			s.Run("")
		}
	case 3:
		bug.On(os.Args[1] != "-s", fmt.Sprintf("Invalid command line: %v", os.Args))
		port, err := strconv.Atoi(os.Args[2])
		bug.On(port <= 0 || err != nil, fmt.Sprintf("Invalid command line: %v", os.Args))
		s.Run(":" + os.Args[2])
	}
}
