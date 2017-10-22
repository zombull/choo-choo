package server

import (
	"crypto/md5"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"path"
	"sort"
	"strconv"
	"strings"
	"unicode"

	"github.com/labstack/echo"

	"github.com/zombull/floating-castle/bug"
	"github.com/zombull/floating-castle/database"
	"github.com/zombull/floating-castle/moonboard"
)

type KeyValueStore struct {
	root string
	dir  string
	data map[string][]byte
	sums map[string][]byte
	// client *redis.Client
}

func newStore(root string) *KeyValueStore {
	s := KeyValueStore{
		dir:  root,
		data: make(map[string][]byte),
		sums: make(map[string][]byte),
	}

	dataDir := path.Join(s.dir, "data")

	infos, err := ioutil.ReadDir(dataDir)
	bug.OnError(err)

	for _, fi := range infos {
		if fi.Mode().IsRegular() {
			name := path.Join(dataDir, fi.Name())

			if strings.HasSuffix(fi.Name(), ".json") {
				s.data[strings.TrimSuffix(fi.Name(), ".json")], err = ioutil.ReadFile(name)
				bug.OnError(err)
			} else if strings.HasSuffix(fi.Name(), ".md5") {
				s.sums[strings.TrimSuffix(fi.Name(), ".md5")], err = ioutil.ReadFile(name)
				bug.OnError(err)
			}
		}
	}

	// s.client = redis.NewClient(&redis.Options{
	// 	Addr:     "127.0.0.1:6379",
	// 	Password: "", // no password set
	// 	DB:       0,  // use default DB
	// })

	// _, err := s.client.Ping().Result()
	// bug.OnError(err)

	return &s
}

const internalServerError = "I'm freakin' out, man!  Please try again at a later time."

func (s *KeyValueStore) get(c echo.Context, key, notFound string) error {
	val, ok := s.data[key]
	if !ok && len(notFound) > 0 {
		return echo.NewHTTPError(http.StatusNotFound, notFound)
	} else if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, internalServerError)
	}
	return c.JSONBlob(http.StatusOK, val)

	// val, err := s.client.Get(key).Result()
	// if err == redis.Nil && len(notFound) > 0 {
	// 	return echo.NewHTTPError(http.StatusNotFound, notFound)
	// } else if err != nil {
	// 	return echo.NewHTTPError(http.StatusInternalServerError, internalServerError)
	// }
	// return c.JSONBlob(http.StatusOK, []byte(val))
}

func (s *KeyValueStore) getInternal(key string) func(c echo.Context) error {
	return func(c echo.Context) error {
		return s.get(c, key, "")
	}
}

func (s *KeyValueStore) getTicks(host string) func(c echo.Context) error {
	return func(c echo.Context) error {
		return s.get(c, "ticks:"+host, fmt.Sprintf("Did not find any ticks for '%s'", host))
	}
}

func (s *KeyValueStore) getCrag(c echo.Context) error {
	crag := c.Param("crag")
	return s.get(c, "crag:"+crag, fmt.Sprintf("The crag '%s' was not found.", crag))
}

func (s *KeyValueStore) getArea(c echo.Context) error {
	crag := c.Param("crag")
	area := c.Param("area")
	return s.get(c, "area:"+crag+":a:"+area, fmt.Sprintf("The area '%s' was not found in %s.", area, crag))
}

func (s *KeyValueStore) getRoute(c echo.Context) error {
	crag := c.Param("crag")
	route := c.Param("route")
	return s.get(c, "route:"+crag+":"+route, fmt.Sprintf("The route '%s' was not found in %s.", route, crag))
}

func (s *KeyValueStore) getProblem(c echo.Context) error {
	set := c.Param("set")
	problem := c.Param("problem")
	return s.get(c, "problem:"+set+":"+problem, fmt.Sprintf("The problem '%s' was not found in Moonboard set %s.", problem, set))
}

func checksum(b []byte) []byte {
	return []byte(fmt.Sprintf("%x", md5.Sum(b)))
}

func sanitize(s string) string {
	return strings.ToLower(strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) {
			return -1
		}
		return r
	}, s))
}

type holds struct {
	Start        []string `json:"s"`
	Intermediate []string `json:"i"`
	Finish       []string `json:"f"`
}

type moonEntry struct {
	Url           string `json:"u"`
	Name          string `json:"n"`
	LowerCaseName string `json:"l"`
	Date          string `json:"t,omitempty"`
	Nickname      string `json:"k,omitempty"`
	Holds         holds  `json:"h,omitempty"`
	Problems      []int  `json:"p,omitempty"`
	Setter        int    `json:"e,omitempty"`
	Grade         string `json:"g,omitempty"`
	Difficulty    uint   `json:"d,omitempty"`
	Stars         uint   `json:"s,omitempty"`
	Id            uint   `json:"i,omitempty"` // Moonboard ID
	Ascents       uint   `json:"a,omitempty"`
	Benchmark     bool   `json:"b,omitempty"`
	Comment       string `json:"c,omitempty"`
}

type moonData struct {
	Index    []moonEntry    `json:"i"`
	Problems map[string]int `json:"p"`
	Setters  map[string]int `json:"s"`
	Grades   [17][]int      `json:"g"`
	Images   []string       `json:"img"`
}

type moonTick struct {
	Problem  int    `json:"p"`
	Date     string `json:"d"`
	Grade    string `json:"g"`
	Stars    uint   `json:"s"`
	Attempts uint   `json:"a"`
	Sessions uint   `json:"e"`
}

func getProblemUrl(s string) string {
	ss := strings.Split(strings.Trim(s, "/"), "/")
	s = ss[len(ss)-1]
	bug.On(len(s) == 0, fmt.Sprintf("%d %v", len(ss), ss))
	bug.On(s != strings.ToLower(s), "Moonboard has a case sensitive URL?")
	return s
}

func getSetterUrl(s string) string {
	return "s/" + url.PathEscape(sanitize(s))
}

func sortProblems(index []moonEntry, problems []int) {
	sort.Slice(problems, func(i, j int) bool {
		p1 := index[problems[i]]
		p2 := index[problems[j]]

		// Note that the return is inverted from what might be expected
		// by a "Less" function, as we effectively want a reverse sort,
		// e.g. higher stars and ascents at the front of the list.
		if p1.Ascents < 50 && p2.Ascents > 200 || p1.Ascents < 50 && p2.Ascents > 100 && p2.Stars > 1 {
			return false
		} else if p1.Ascents > 200 && p2.Ascents < 50 || p1.Ascents > 100 && p2.Ascents < 50 && p1.Stars > 1 {
			return true
		} else if p1.Stars == p2.Stars {
			return p1.Ascents > p2.Ascents
		}
		return p1.Stars > p2.Stars
	})
}

func (s *KeyValueStore) update(d *database.Database) {
	setters := d.GetSetters(moonboard.Id(d))
	bug.On(len(setters) == 0, fmt.Sprintf("No moonboard setters found: %d", moonboard.Id(d)))

	routes := d.GetAllRoutes(moonboard.Id(d))
	bug.On(len(routes) == 0, fmt.Sprintf("No moonboard routes found: %d", moonboard.Id(d)))

	nr := len(routes)
	md := moonData{
		Index:    make([]moonEntry, nr, len(setters)+nr),
		Problems: make(map[string]int),
		Setters:  make(map[string]int),
		Images:   make([]string, 150),
	}
	for i := range md.Grades {
		if i >= 4 && i <= 10 {
			md.Grades[i] = make([]int, 0, 100)
		} else {
			md.Grades[i] = make([]int, 0)
		}
	}

	for _, r := range setters {
		e := moonEntry{
			Url:           getSetterUrl(r.Name),
			Name:          r.Name,
			Nickname:      r.Nickname,
			LowerCaseName: strings.ToLower(r.Name),
			Problems:      make([]int, 0),
		}
		if _, ok := md.Setters[e.Url]; !ok {
			md.Setters[e.Url] = len(md.Index)
			md.Index = append(md.Index, e)
		}
	}

	sort.Slice(routes, func(i, j int) bool {
		return strings.ToLower(routes[i].Name) < strings.ToLower(routes[j].Name)
	})

	for i, r := range routes {
		sn := d.GetSetter(r.SetterId).Name
		setter, ok := md.Setters[getSetterUrl(d.GetSetter(r.SetterId).Name)]
		bug.On(!ok, fmt.Sprintf("Moonboard problem has undefined setter: %s", sn))

		e := moonEntry{
			Url:           getProblemUrl(r.Url),
			Name:          r.Name,
			LowerCaseName: strings.ToLower(r.Name),
			Date:          r.Date.Format("January 02, 2006"),
			Setter:        setter,
			Grade:         r.Grade,
			Difficulty:    conversions[r.Grade],
			Stars:         r.Stars,
			Id:            r.Length,
			Ascents:       r.Pitches,
			Benchmark:     r.Benchmark,
			Comment:       r.Comment,
		}

		e.Holds = holds{
			Start:        make([]string, 0),
			Intermediate: make([]string, 0),
			Finish:       make([]string, 0),
		}

		h2 := d.GetHolds(r.Id)
		for _, v := range h2.Holds {
			h := string(v[1:])
			if string(v[0]) == "s" {
				e.Holds.Start = append(e.Holds.Start, h)
			} else if string(v[0]) == "f" {
				e.Holds.Finish = append(e.Holds.Finish, h)
			} else {
				e.Holds.Intermediate = append(e.Holds.Intermediate, h)
			}
		}
		bug.On(len(e.Holds.Start) == 0, "No start hold found")
		bug.On(len(e.Holds.Finish) == 0, "No finish hold found")

		// Sort the holds so that the checksum is stable.
		sort.Strings(e.Holds.Start)
		sort.Strings(e.Holds.Intermediate)
		sort.Strings(e.Holds.Finish)

		if _, ok = md.Problems[e.Url]; ok {
			e.Url = fmt.Sprintf("%d-%s", e.Id, e.Url)
			fmt.Printf("Duplicate Moonboard problem, new URL: %s\n", e.Url)
			_, ok = md.Problems[e.Url]
		}
		bug.On(ok, fmt.Sprintf("Duplicate Moonboard problem URL: %s", e.Url))
		md.Problems[e.Url] = i

		md.Index[i] = e
		md.Index[setter].Problems = append(md.Index[setter].Problems, i)

		bug.On((e.Difficulty/10) > 16, "Really, a V17?  Hello, Nalle!")
		md.Grades[(e.Difficulty / 10)] = append(md.Grades[(e.Difficulty/10)], i)
	}

	for i := nr; i < len(md.Index); i++ {
		sortProblems(md.Index, md.Index[i].Problems)
	}

	for i := range md.Grades {
		sortProblems(md.Index, md.Grades[i])
	}

	imgDir := path.Join(s.dir, "moonboard", "img")
	for i := 0; i < 150; i++ {
		if i > 40 && i < 50 {
			continue
		}
		n := "board"
		if i > 0 {
			n = strconv.Itoa(i)
		}
		img, err := ioutil.ReadFile(path.Join(imgDir, n+".png"))
		bug.OnError(err)

		md.Images[i] = base64.StdEncoding.EncodeToString(img)
	}

	b, err := json.Marshal(md)
	bug.OnError(err)

	s.data["moonboard"] = b
	s.sums["moonboard"] = checksum(b)

	dataDir := path.Join(s.dir, "data")
	err = ioutil.WriteFile(path.Join(dataDir, "moonboard.json"), b, 0644)
	bug.OnError(err)
	err = ioutil.WriteFile(path.Join(dataDir, "moonboard.md5"), checksum(b), 0644)
	bug.OnError(err)
}

type betaEntry struct {
	Name          string `json:"n"`
	LowerCaseName string `json:"l"`
	Url           string `json:"u"`
	Grade         string `json:"g,omitempty"`
	Pitches       uint   `json:"p,omitempty"`
	Stars         uint   `json:"s,omitempty"`
	Types         string `json:"t,omitempty"` // bstar = Boulder+Sport+Trade+Aid+topRope
	Difficulty    uint   `json:"d,omitempty"`
}

// func (s *KeyValueStore) processKeys(req, res, err, keys) {
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

// func (s *KeyValueStore) getGo(c echo.Context) {
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

// var skips = map [string][]string{
//     "joshuatree-5.9-trad.json": {
//         "Bonny's Boo-Boo",
//         "Date Rape",
//         "Flakey Friends",
//         "Mystic Knights of the Sea",
// 	},
// }

// var _ = require('lodash'),
//     fs = require('fs'),
//     path = require('path'),
//     crypto = require('crypto'),
//     grades = require('../mp/grades'),
//     skips = require('./skips'),
//     duplicates = require('./duplicates');

// func (s *KeyValueStore) func(cragUrl, areaName string, a *area, isBoulder bool)
//     if (isBoulder) {
//         crags[cragUrl].areas.bouldering = crags[cragUrl].areas.bouldering || {};
//         crags[cragUrl].areas.bouldering[areaName] = area;
//     }
//     else {
//         crags[cragUrl].areas.climbing = crags[cragUrl].areas.climbing || {};
//         crags[cragUrl].areas.climbing[areaName] = area;
//     }
// }

// // var routeFiles = fs.readdirSync(path.join(__dirname, '../data/routes'));
// _.each(routeFiles, function(routeFile) {

//     // var fileRoutes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/routes', routeFile), 'utf8'));

// 	_.each(fileRoutes, function(route) {

//         if (_.includes(skips[routeFile], route.name)) {
//             return;
//         }

//         var addAreaName = /^Unknown$/i.test(route.name) || /^Problem\s?/i.test(route.name) || /^Unnamed\s?/i.test(route.name) || (_.includes(duplicates[route.crag], route.name));
//         if (addAreaName) {
//             route.name = '{0} ({1})'.format(route.name, route.subarea ? route.subarea.name : route.area.name);
//         }

//         var isBoulder = route.grade.yds ? false : true;

//         var cragName = sanitize(route.crag)
//         var areaName = sanitize(route.area.name);
//         var subareaName = route.subarea ? sanitize(route.subarea.name) : '';
//         var routeName = sanitize(route.name);

//         var cragUrl = cragName;
//         var areaUrl = cragUrl + '/a/' + areaName;
//         var subareaUrl = cragUrl + '/a/' + subareaName;
//         var routeUrl = cragUrl + '/' + routeName;

//         if (routeUrl in routes) {
//             // console.log(JSON.stringify(route.name) + ',');
//             throw '\nDuplicate Route: ' + JSON.stringify(route) + '\n\n\nExisting Route: ' + JSON.stringify(routes[routeUrl]);
//         }

//         if (!(cragUrl in crags)) {
//             var cragIndex = {
//                 name: route.crag,
//                 lname: route.crag.toLowerCase(),
//                 url: cragUrl
//             };
//             index.push(cragIndex);

//             var crag = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/crags', cragUrl + '.json'), 'utf8'));
//             crag.url = cragUrl;
//             crag.areas = { };
//             crag.multilevel = (crag.multilevel || route.subarea) ? true : false,
//             crag.routes = {};
//             crag.index = [ cragIndex ];
//             crags[cragUrl] = crag;
//         }

//         if (!(areaUrl in areas)) {
//             var areaIndex = {
//                 name: route.area.name,
//                 lname: route.area.name.toLowerCase(),
//                 url: areaUrl
//             };
//             index.push(areaIndex);
//             crags[cragUrl].index.push(areaIndex);

//             var area = {
//                 name: route.area.name,
//                 url: areaUrl,
//                 crag: { name: route.crag, url: cragUrl },
//                 links: [{name: 'Mountain Project', url: route.area.mountainproject}]
//             };
//             areas[areaUrl] = area;

//             addArea(cragUrl, areaName, area, isBoulder);
//         }
//         else if (isBoulder && (!crags[cragUrl].areas.bouldering || !crags[cragUrl].areas.bouldering.hasOwnProperty(areaName))) {
//             addArea(cragUrl, areaName, areas[areaUrl], isBoulder);
//         }
//         else if (!isBoulder && (!crags[cragUrl].areas.climbing || !crags[cragUrl].areas.climbing.hasOwnProperty(areaName))) {
//             addArea(cragUrl, areaName, areas[areaUrl], isBoulder);
//         }

//         if (route.subarea && !(subareaUrl in areas)) {
//             var subareaIndex = {
//                 name: route.subarea.name,
//                 lname: route.subarea.name.toLowerCase(),
//                 url: subareaUrl
//             };
//             index.push(subareaIndex);
//             crags[cragUrl].index.push(subareaIndex);

//             var subarea = {
//                 name: route.subarea.name,
//                 url: subareaUrl,
//                 crag: { name: route.crag, url: cragUrl },
//                 area: { name: route.area.name, url: areaUrl },
//                 links: [{name: 'Mountain Project', url: route.subarea.mountainproject}]
//             };
//             areas[subareaUrl] = subarea;

//             if (isBoulder) {
//                 areas[areaUrl].boulders = areas[areaUrl].boulders || [];
//                 areas[areaUrl].boulders.push(subareaName);
//             }
//             else {
//                 areas[areaUrl].areas = areas[areaUrl].areas || [];
//                 areas[areaUrl].areas.push(subareaName);
//             }

//             crags[cragUrl].subareas = crags[cragUrl].subareas || {};
//             crags[cragUrl].subareas[subareaName] = subarea;
//         }

//         if (route.subarea && (!crags[cragUrl].subareas || !crags[cragUrl].subareas.hasOwnProperty(subareaName))) {
//             throw 'Duplicate Subarea: ' + JSON.stringify(route.subarea);
//         }

//         var routeIndex = {
//             name: route.name,
//             meta: (isBoulder ? route.grade.hueco : route.grade.yds) + (route.mod ? ' ' + route.mod : ''),
//             lname: route.name.toLowerCase(),
//             url: routeUrl,
//             types: _.reduce(route.types, function(types, t) { t = t.toLowerCase(); return types + (t === 'sport' ? 's' : t === 'trad' ? 't' : t === 'aid' ? 'a' : t === 'tr' ? 'r' : t === 'boulder' ? 'b' : ''); }, ''),
//             grade: isBoulder ? grades.convert(route.grade.hueco) : grades.convert(route.grade.yds),
//             pitches: route.pitches
//         };
//         index.push(routeIndex);
//         crags[cragUrl].index.push(routeIndex);

//         var ownerUrl = route.subarea ? subareaUrl : areaUrl;
//         if (isBoulder) {
//             areas[ownerUrl].problems = areas[ownerUrl].problems || [];
//             areas[ownerUrl].problems.push(routeName);
//         }
//         else {
//             areas[ownerUrl].routes = areas[ownerUrl].routes || [];
//             areas[ownerUrl].routes.push(routeName);
//         }

//         var routeEntry = _.omit(route, ['crag', 'area', 'subarea', 'mountainproject']);
//         routeEntry.url = routeUrl;
//         routeEntry.crag = { name: route.crag, url: cragUrl };
//         routeEntry.area = route.subarea ? { name: route.subarea.name, url: subareaUrl } : { name: route.area.name, url: areaUrl };
//         routeEntry.links = [ {name: 'Mountain Project', url: route.mountainproject} ];

//         routes[routeUrl] = routeEntry;
//         crags[cragUrl].routes[routeName] = routeEntry;
//     });
// });

// function routeFilter(entry) {
//     return entry.hasOwnProperty('grade');
// }

// function areaFilter(entry) {
//     return entry.url.indexOf('/a/') !== -1;
// }

// function cragFilter(entry) {
//     return !routeFilter(entry) && !areaFilter(entry);
// }

// var checksums = {};

// // Sort by name, crags first then routes.  Omit areas in the main index.
// index = _.sortBy(index.filter(cragFilter), 'lname').concat(_.sortBy(index.filter(routeFilter), 'lname'));
// checksums.index = checksum(index);

// function fillStats(crag, code, name) {
//     var count = _.filter(crag.index, function(entry) {
//         return entry.types && entry.types.indexOf(code) !== -1;
//     }).length;

//     if (count) {
//         crag.stats.push({ name: name, count: count });
//     }
// }
// _.each(crags, function(crag) {
//     crag.index = _.sortBy(crag.index.filter(cragFilter), 'lname').concat(_.sortBy(crag.index.filter(areaFilter), 'lname')).concat(_.sortBy(crag.index.filter(routeFilter), 'lname'));
//     crag.stats = [];
//     fillStats(crag, 'b', 'Boulder Problems');
//     fillStats(crag, 's', 'Sport Routes');
//     fillStats(crag, 't', 'Trad Routes');
//     fillStats(crag, 'a', 'Aid Routes');
//     fillStats(crag, 'r', 'TR Routes');

//     checksums['crag/' + crag.url] = checksum(crag);
// });

// _.each(areas, function(area) {
//     if (area.areas) {
//         area.areas = area.areas.sort();
//     }
//     if (area.boulders) {
//         area.boulders = area.boulders.sort();
//     }
//     if (area.routes) {
//         area.routes = area.routes.sort();
//     }
//     if (area.problems) {
//         area.problems = area.problems.sort();
//     }
// })

// exports.checksums = checksums;
// exports.index = index;
// exports.crags = crags;
// exports.areas = areas;
// exports.routes = routes;
