package server

import (
	"fmt"
	"net/http"

	"github.com/zombull/choo-choo/bug"

	"github.com/go-redis/redis"
	"github.com/labstack/echo"
)

type ServerData struct {
	client *redis.Client
}

func newData() *ServerData {
	data := ServerData{}

	data.client = redis.NewClient(&redis.Options{
		Addr:     "127.0.0.1:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err := data.client.Ping().Result()
	bug.OnError(err)

	return &data
}

const internalServerError = "I'm freakin' out, man!  Please try again at a later time."

func (d *ServerData) getKey(c echo.Context, key, notFound string) error {
	val, err := d.client.Get(key).Result()
	if err == redis.Nil && len(notFound) > 0 {
		return echo.NewHTTPError(http.StatusNotFound, notFound)
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, internalServerError)
	}
	return c.JSONBlob(http.StatusOK, []byte(val))
}

func (d *ServerData) getIndex(c echo.Context) error {
	return d.getKey(c, "index", "")
}

func (d *ServerData) getCrag(c echo.Context) error {
	crag := c.Param("crag")
	return d.getKey(c, "crag:"+crag, fmt.Sprintf("The crag '%s' was not found.", crag))
}

func (d *ServerData) getArea(c echo.Context) error {
	crag := c.Param("crag")
	area := c.Param("area")
	return d.getKey(c, "area:"+crag+":a:"+area, fmt.Sprintf("The area '%s' was not found in %s.", area, crag))
}

func (d *ServerData) getRoute(c echo.Context) error {
	crag := c.Param("crag")
	route := c.Param("route")
	return d.getKey(c, "route:"+crag+":"+route, fmt.Sprintf("The route '%s' was not found in %s.", route, crag))
}

// func (d *ServerData) processKeys(req, res, err, keys) {
// 	if (err) {
// 		return res.status(500).send(internalServerError);
// 	}
// 	if (keys && keys.length) {
// 		return client.get(keys[0], function(err, data) {
// 			if (err) {
// 				return res.status(500).send(internalServerError);
// 			}
// 			var entry = JSON.parse(data);
// 			if (!entry || !entry.url) {
// 				return res.status(500).send(internalServerError);
// 			}
// 			if (req.query.mp && entry.links) {
// 				var mpLinks = entry.links.filter(function(link) { return link.name === "Mountain Project"; });
// 				if (mpLinks.length) {
// 					return res.redirect(mpLinks[0].url);
// 				}
// 			}
// 			return res.redirect(entry.url);
// 		});
// 	}
// 	return "continue";
// };

// func (d *ServerData) getGo(c echo.Context) {
// 	if (!req.query.q) {
// 		return files.error400(req, res);
// 	}
// 	req.query.q = req.query.q.replace(/\s*/g, "");

// 	client.keys("crag:*" + req.query.q + "*", function (err, keys) {
// 		if (processKeys(req, res, err, keys) === "continue") {

// 			client.keys("area:*" + req.query.q + "*", function (err, keys) {
// 				if (processKeys(req, res, err, keys) === "continue") {

// 					client.keys("route:*" + req.query.q + "*", function (err, keys) {
// 						if (processKeys(req, res, err, keys) === "continue") {
// 							return files.error404(req, res);
// 						}
// 					});
// 				}
// 			});
// 		}
// 	});
// };
