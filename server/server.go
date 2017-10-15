package server

import (
	"path"

	"github.com/labstack/echo"
)

const domain = "zombull.xyz"

type SubDomain struct {
	Echo *echo.Echo
}

func Run(port string) {
	beta := echo.New()

	beta.Static("/favicon", "common/img/favicon")
	beta.Static("/static", "beta")
	beta.Static("/common", "common")

	// // Send back the main HTML page when accessing a front facing URL.
	beta.File("/", "beta/index.html")
	beta.File("/:crag", "beta/index.html")
	beta.File("/:crag/a/:area", "beta/index.html")
	beta.File("/:crag/:route", "beta/index.html")

	// beta.GET("/", getIndex)
	// beta.GET("/:crag", getIndex)
	// beta.GET("/:crag/a/:area", getIndex)
	// beta.GET("/:crag/:route", getIndex)

	beta.GET("/partials/:name", getPartials)

	db := newData()

	// beta.get('/go', db.go);
	beta.GET("/data/index", db.getIndex)
	beta.GET("/data/crag/:crag", db.getCrag)
	beta.GET("/data/area/:crag/:area", db.getArea)
	beta.GET("/data/route/:crag/:route", db.getRoute)

	// Setting up beta global  CORS policy
	// These policy guidelines are overriddable at a per resource level shown below
	// beta.SetGlobalCors(&vestigo.CorsAccessControl{
	// 	AllowOrigin:      []string{"*", "test.com"},
	// 	AllowCredentials: true,
	// 	ExposeHeaders:    []string{"X-Header", "X-Y-Header"},
	// 	MaxAge:           24 * 365 * time.Hour,
	// 	AllowHeaders:     []string{"X-Header", "X-Y-Header"},
	// })

	// Catch-All methods to allow easy migration from http.ServeMux
	// beta.HandleFunc("/general", GeneralHandler)

	// Below Applies Local CORS capabilities per Resource (both methods covered)
	// by default this will merge the "GlobalCors" settings with the resource
	// cors settings.  Without specifying the AllowMethods, the beta will
	// accept any Request-Methods that have valid handlers associated
	// beta.SetCors("/welcome", &vestigo.CorsAccessControl{
	// 	AllowMethods: []string{"GET"},                    // only allow cors for this resource on GET calls
	// 	AllowHeaders: []string{"X-Header", "X-Z-Header"}, // Allow this one header for this resource
	// })

	// Server
	e := echo.New()
	e.Any("/*", func(c echo.Context) error {
		if c.Request().Host == ("beta." + domain + port) {
			beta.ServeHTTP(c.Response(), c.Request())
			return nil
		}

		return c.File("beta/substorage.html")
	})
	e.Logger.Fatal(e.Start(port))
}

// func getIndex(c echo.Context) error {
// 	// fmt.Printf("INDEX: %s", c.Request().URL.Path)
// 	// return c.File("public/index.html")
// }

func getPartials(c echo.Context) error {
	return c.File(path.Join("beta/partials/", c.Param("name")))
}
