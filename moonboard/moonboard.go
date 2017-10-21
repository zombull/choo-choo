package moonboard

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"golang.org/x/net/html"

	"github.com/zombull/floating-castle/bug"
	"github.com/zombull/floating-castle/database"
)

var moonboardToDatabaseHolds = map[string]string{
	"SH1":  "start_1",
	"SH2":  "start_2",
	"IH1":  "intermediate_1",
	"IH2":  "intermediate_2",
	"IH3":  "intermediate_3",
	"IH4":  "intermediate_4",
	"IH5":  "intermediate_5",
	"IH6":  "intermediate_6",
	"IH7":  "intermediate_7",
	"IH8":  "intermediate_8",
	"IH9":  "intermediate_9",
	"IH10": "intermediate_10",
	"IH11": "intermediate_11",
	"IH12": "intermediate_12",
	"IH13": "intermediate_13",
	"IH14": "intermediate_14",
	"IH15": "intermediate_15",
	"IH16": "intermediate_16",
	"IH17": "intermediate_17",
	"IH18": "intermediate_18",
	"IH19": "intermediate_19",
	"IH20": "intermediate_20",
	"FH1":  "finish_one",
	"FH2":  "finish_two",
}

var databaseToMoonboardHolds = map[string]string{
	"start_1":         "SH1",
	"start_2":         "SH2",
	"intermediate_1":  "IH1",
	"intermediate_2":  "IH2",
	"intermediate_3":  "IH3",
	"intermediate_4":  "IH4",
	"intermediate_5":  "IH5",
	"intermediate_6":  "IH6",
	"intermediate_7":  "IH7",
	"intermediate_8":  "IH8",
	"intermediate_9":  "IH9",
	"intermediate_10": "IH10",
	"intermediate_11": "IH11",
	"intermediate_12": "IH12",
	"intermediate_13": "IH13",
	"intermediate_14": "IH14",
	"intermediate_15": "IH15",
	"intermediate_16": "IH16",
	"intermediate_17": "IH17",
	"intermediate_18": "IH18",
	"intermediate_19": "IH19",
	"intermediate_20": "IH20",
	"finish_one":      "FH1",
	"finish_two":      "FH2",
}

var setName = ""
var userName = ""

const Name = "Moonboard"

func init() {
	for _, k := range database.HoldKeys {
		if k == "route_id" {
			continue
		}
		v, ok := databaseToMoonboardHolds[k]
		k2, ok2 := moonboardToDatabaseHolds[v]
		bug.On(!ok || !ok2 || k != k2, fmt.Sprintf("map/slice mismatch on Moonboard holds, k=%s, k2=%s, v=%s, ok=%t, ok2=%t", k, k2, v, ok, ok2))
	}
}

func Init(d *database.Database, set, user string) {
	exists := d.Exists(Name, "crags")

	userName = user
	setName = strings.TrimSpace(set)
	if len(setName) == 0 {
		if exists {
			fmt.Printf("Moonboard exists in your database but no set is defined in your config!\n\n")
		}
		return
	}

	if !exists {
		c := database.Crag{
			Name:     Name,
			Location: "Portland Rock Gym",
			Url:      "https://www.moonboard.com/",
			Map:      "https://www.moonboard.com/problems",
		}
		d.Insert(&c)
	}
	if !d.Exists(setName, "areas") {
		a := database.Area{
			CragId: d.GetCragId(Name),
			Name:   setName,
			Url:    "https://www.moonboard.com/problems",
		}
		d.Insert(&a)
	}
}

func SetDefined() bool {
	return len(setName) > 0
}

func Id(d *database.Database) int64 {
	return d.GetCragId(Name)
}

func SetId(d *database.Database) int64 {
	bug.On(!SetDefined(), "accessing undefined Moonboard set")
	return d.GetAreaId(Id(d), setName)
}

func InsertProblem(d *database.Database, r *database.Route) {
	bug.On(r.CragId != Id(d) || r.Type != "moonboard", "invalid call to moonboard.InsertProblem")

	h := database.Holds{
		RouteId: r.Id,
	}

	var setter string
	h.Holds, setter, r.Pitches = getProblemDetails(r)
	bug.On(len(h.Holds) == 0, fmt.Sprintf("failed to parse holds for Moonboard problem '%s'", r.Name))
	bug.On(len(setter) == 0, fmt.Sprintf("failed to parse setter for Moonboard problem '%s'", r.Name))

	var s *database.Setter
	if s = d.FindSetter(r.CragId, setter); s == nil {
		s = &database.Setter{
			CragId:   r.CragId,
			Name:     setter,
			Inactive: false,
		}
		d.Insert(s)
	}
	r.SetterId = s.Id

	d.InsertDoubleLP(r, &h)
}

func searchWebSite(query, prefix string) (map[string]string, []string) {
	c := &http.Client{Timeout: time.Second * 30}

	m := make(map[string]string)
	a := []string{}

	pages := uint(1)
	for i := uint(1); i <= pages; i++ {
		if i == 1 {
			fmt.Printf("GET https://www.moonboard.com/page/%d/?s=%s\n", i, query)
		} else {
			fmt.Printf("GET %d of %d https://www.moonboard.com/page/%d/?s=%s\n", i, pages, i, query)
		}
		r, err := c.Get(fmt.Sprintf("https://www.moonboard.com/page/%d/?s=%s", i, query))
		bug.OnError(err)
		if r.StatusCode == http.StatusNotFound {
			bug.On(i == 1 || i < pages, "unexpected 404 when searching moonboard")
			break
		}
		bug.On(r.StatusCode != http.StatusOK, fmt.Sprintf("unexpected HTTP.GET error %d", r.StatusCode))

		z := html.NewTokenizer(r.Body)
		for {
			tt := z.Next()
			if tt == html.ErrorToken {
				break
			} else if tt == html.StartTagToken {
				t := z.Token()
				if t.Data != "a" {
					continue
				}

				href := ""
				isBookmark := false
				for _, a := range t.Attr {
					if a.Key == "href" {
						if strings.HasPrefix(a.Val, prefix) {
							href = a.Val
						} else if ui, ok := regexParseUint(numSearchPagesRegex, a.Val, false); ok && pages < ui {
							pages = ui
						}
					} else if a.Key == "rel" && a.Val == "bookmark" {
						isBookmark = true
					}
				}

				if href == "" || !isBookmark {
					continue
				}
				a = append(a, href)
				bug.On(z.Next() != html.TextToken, "empty link name in search results")

				t = z.Token()
				if _, ok := m[t.Data]; !ok {
					m[t.Data] = href
				}
			}
		}
	}
	return m, a
}

func regexFindGroup(r *regexp.Regexp, s string) (string, bool) {
	if ss := r.FindStringSubmatch(strings.TrimSpace(s)); len(ss) >= 2 {
		return strings.TrimSpace(ss[1]), true
	}
	return "", false
}

func regexParseUint(r *regexp.Regexp, s string, optional bool) (uint, bool) {
	if g, ok := regexFindGroup(r, s); ok {
		i, err := strconv.ParseUint(g, 10, 64)
		if optional {
			if err != nil || i == 0 {
				fmt.Println("Bad data in comment section, falling back to log")
				return 0, false
			}
		} else {
			bug.OnError(err)
		}

		return uint(i), true
	}
	return 0, false
}

var numSearchPagesRegex = regexp.MustCompile(`https:\/\/www\.moonboard\.com\/page\/([0-9]+)\/\?s=`)

var attemptsRegex = regexp.MustCompile(`Attempts: ([0-9]+)`)
var sessionsRegex = regexp.MustCompile(`Sessions: ([0-9]+)`)
var starsRegex = regexp.MustCompile(`Stars: ([0-9]+)`)
var commentRegex = regexp.MustCompile(`Comment: ([[:ascii:]]+)`)

var shortlinkRegex = regexp.MustCompile(`^[0-9]+$`)
var numTriesRegex = regexp.MustCompile(`Number of tries: ([0-9A-Za-z ]+)`)
var gradeRatingRegex = regexp.MustCompile(`Grade rating: ([0-9A-Ca-c\+]+)`)
var gradeRegex = regexp.MustCompile(`Grade : ([0-9A-Ca-c\+]+)`)
var repeatsRegex = regexp.MustCompile(`Grade : ([0-9A-Ca-c\+]+)`)
var starRatingRegex = regexp.MustCompile(`Star rating: ([0-9]+) stars`)
var dateClimbedRegex = regexp.MustCompile(`Date climbed: ([0-9\/]+)`)

var triesToAttempts = map[string]uint{
	"Flashed":           1,
	"2nd try":           2,
	"3rd try":           3,
	"more than 3 tries": 10,
}

func insertRouteAndTick(d *database.Database, tickUrl string, body io.Reader) {
	tick := &database.Tick{
		CragId:   Id(d),
		AreaId:   SetId(d),
		Redpoint: true,
		Sessions: 1,
		Url:      tickUrl,
	}
	route := &database.Route{
		CragId: Id(d),
		AreaId: SetId(d),
		Type:   "moonboard",
	}

	z := html.NewTokenizer(body)
	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			break
		} else if tt == html.TextToken {
			t := z.Token()

			if ui, ok := regexParseUint(attemptsRegex, t.Data, true); ok {
				tick.Attempts = ui
			} else if s, ok := regexFindGroup(numTriesRegex, t.Data); ok && tick.Attempts == 0 {
				tick.Attempts, ok = triesToAttempts[s]
				bug.On(!ok, fmt.Sprintf("Unhandled case in 'Number of tries': %s", s))
			}
			if ui, ok := regexParseUint(sessionsRegex, t.Data, true); ok {
				tick.Sessions = ui
			}
			if ui, ok := regexParseUint(starsRegex, t.Data, true); ok {
				route.Stars = ui
			} else if ui, ok := regexParseUint(starRatingRegex, t.Data, false); ok && route.Stars == 0 {
				route.Stars = ui + 1
			}
			if s, ok := regexFindGroup(commentRegex, t.Data); ok {
				tick.Comment = s
			}
			if s, ok := regexFindGroup(gradeRatingRegex, t.Data); ok {
				route.Grade, ok = database.FontainebleauToHueco[strings.ToUpper(s)]
				bug.On(!ok, fmt.Sprintf("Unhandled case in 'Grade rating': %s", s))
			}
			if s, ok := regexFindGroup(dateClimbedRegex, t.Data); ok {
				var err error
				tick.Date, err = time.Parse("02/01/06", s)
				bug.OnError(err)
			}
		} else if tt == html.StartTagToken {
			t := z.Token()
			if t.Data != "a" {
				continue
			}

			href := ""
			title := ""
			isPound := false
			isPopup := false
			for _, a := range t.Attr {
				if a.Key == "href" && a.Val == "#" {
					isPound = true
				} else if a.Key == "class" && a.Val == "problemPopup" {
					isPopup = true
				} else if a.Key == "rel" && shortlinkRegex.MatchString(a.Val) {
					href = fmt.Sprintf("https://www.moonboard.com/?p=%s", a.Val)
				} else if a.Key == "title" {
					title = a.Val
				}
			}
			if isPopup && isPound {
				bug.On(len(href) == 0 || len(title) == 0, "Identified Moonboard problem but unabled to parse link or title")
				route.Url = href
				route.Name = title
			}
		}
	}
	if len(route.Name) > 0 {
		bug.On(route.Stars == 0, "Found Moonboard route, failed to parse number of stars")
		bug.On(len(route.Grade) == 0, "Found Moonboard route, failed to parse grade")
		bug.On(tick.Date.IsZero(), "Found Moonboard route, failed to parse tick date")
		bug.On(tick.Attempts == 0, "Found Moonboard route, failed to parse number of attempts")

		tick.Flash = (tick.Attempts == 1)

		existing := d.FindRoute(route.AreaId, route.Name)
		if existing == nil {
			InsertProblem(d, route)
		} else {
			route = existing
		}
		fmt.Printf("Problem"+database.FORMAT_ROUTE, route.Name, route.Type, route.Grade, route.Stars, route.Length, route.Pitches, route, route.Url, route.Comment)

		tick.RouteId = route.Id
		d.Insert(tick)

		fmt.Printf("Tick"+database.FORMAT_TICK, route.Name, tick.Date.Format("January 02, 2006"), tick.Redpoint, tick.Flash, tick.Onsight, tick.Falls, tick.Hangs, tick.Attempts, tick.Sessions, tick.Url, tick.Comment)
	}
}

func SyncLogbook(d *database.Database, optimized bool) {
	if !SetDefined() || len(userName) == 0 {
		return
	}
	prefix := "https://www.moonboard.com/moonboard-logbook/" + strings.Replace(strings.ToLower(userName), " ", "-", -1)
	query := strings.Replace(userName, " ", "+", -1)

	if optimized {
		ticks := d.GetAreaTicks(SetId(d))
		if len(ticks) > 0 {
			latest := ticks[0].Date
			for _, t := range ticks {
				if t.Date.After(latest) {
					latest = t.Date
				}
			}
			query = query + "+" + latest.Format("01/06")
		}
	}

	c := &http.Client{Timeout: time.Second * 30}
	_, a := searchWebSite(query, prefix)
	for _, url := range a {
		if !d.ExistsBy("url", url, "ticks") {
			r, err := c.Get(url)
			bug.OnError(err)
			bug.On(r.StatusCode != http.StatusOK, fmt.Sprintf("unexpected HTTP.GET error %d", r.StatusCode))
			insertRouteAndTick(d, url, r.Body)
		}
	}
}

func QueryProblems(name string) map[string]string {
	name = strings.Replace(name, " ", "+", -1)
	m, a := searchWebSite(name, "https://www.moonboard.com/problems/")
	if len(m) != len(a) {
		fmt.Printf("Duplicate Moonboard problems detected!\n")
	}
	return m
}

var setterRegex = regexp.MustCompile(`Set by : (.+)`)
var ascentsRegex = regexp.MustCompile(`([0-9]+) climbers have repeated this problem`)

func getProblemDetails(route *database.Route) (map[string]string, string, uint) {
	c := &http.Client{Timeout: time.Second * 30}

	r, err := c.Get(route.Url)
	bug.OnError(err)
	bug.On(r.StatusCode != http.StatusOK, fmt.Sprintf("unexpected HTTP.GET error %d", r.StatusCode))

	s := ""
	m := make(map[string]string)
	ascents := -1

	z := html.NewTokenizer(r.Body)
	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			break
		} else if tt == html.TextToken {
			t := z.Token()
			if g, ok := regexFindGroup(setterRegex, t.Data); ok {
				s = g
			} else if t.Data == "Be the first to repeat this problem" {
				bug.On(ascents > 0, "Duplicate matches for number of ascents")
				ascents = 0
			} else if t.Data == "1 climber has repeated this problem" {
				bug.On(ascents != 1 && ascents >= 0, "Duplicate matches for number of ascents")
				ascents = 1
			} else if ui, ok := regexParseUint(ascentsRegex, t.Data, false); ok {
				bug.On(ascents != int(ui) && ascents >= 0, "Duplicate matches for number of ascents")
				ascents = int(ui)
			}
		} else if tt == html.SelfClosingTagToken {
			t := z.Token()
			if t.Data == "link" {
				href := ""
				isCanon := false
				for _, a := range t.Attr {
					if a.Key == "href" {
						href = a.Val
					} else if a.Key == "rel" && a.Val == "canonical" {
						isCanon = true
					}
				}
				if isCanon {
					bug.On(len(href) == 0, "Found canonical link with empty href")
					route.Url = href
				}
			}
		} else if tt == html.StartTagToken {
			t := z.Token()
			if t.Data != "div" {
				continue
			}

			var key, name string
			for _, a := range t.Attr {
				if a.Key == "id" {
					if k, ok := moonboardToDatabaseHolds[a.Val]; ok {
						key = k
					}
				} else if a.Key == "name" {
					name = strings.TrimSpace(a.Val)
				}
			}
			if len(key) > 0 && len(name) > 0 {
				if len(name) != 2 && len(name) != 3 {
					for _, a := range t.Attr {
						fmt.Printf("ATTR: %s=%s\n", a.Key, a.Val)
					}
					bug.Bug(fmt.Sprintf("Invalid hold - key: %s, name: %s", key, name))
				}
				m[key] = name
			}
		}
	}
	bug.On(len(s) == 0, fmt.Sprintf("Failed to identify setter for %s", route.Url))
	bug.On(ascents < 0, "Failed to find number of ascents")
	return m, s, uint(ascents)
}

func SyncIndex(d *database.Database, body io.Reader) {
	if !SetDefined() {
		return
	}

	route := &database.Route{
		CragId: Id(d),
		AreaId: SetId(d),
		Type:   "moonboard",
		Stars:  10,
	}

	isProblem := false
	problemId := ""

	z := html.NewTokenizer(body)
	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			break
		} else if tt == html.TextToken {
			if !isProblem {
				continue
			}
			t := z.Token()

			if s, ok := regexFindGroup(gradeRegex, t.Data); ok {
				route.Grade, ok = database.FontainebleauToHueco[strings.ToUpper(s)]
				bug.On(!ok, fmt.Sprintf("Unhandled case in 'Grade': %s", s))
			}
		} else if tt == html.StartTagToken {
			t := z.Token()

			if t.Data == "div" {
				bug.On(isProblem, "Unexpected DIV found while parsing problem")

				for _, a := range t.Attr {
					if a.Key == "problem-id" {
						isProblem = true
						problemId = a.Val
					} else if a.Key == "star-val" {
						ui, err := strconv.ParseUint(a.Val, 10, 64)
						bug.OnError(err)
						route.Stars = uint(ui)
					}
				}
			} else if t.Data == "a" {
				href := ""
				title := ""
				isPound := false
				isPopup := false
				for _, a := range t.Attr {
					if a.Key == "href" && a.Val == "#" {
						isPound = true
					} else if a.Key == "class" && a.Val == "problemPopup" {
						isPopup = true
					} else if a.Key == "rel" && shortlinkRegex.MatchString(a.Val) {
						bug.On(a.Val != problemId, "DIV problem id does not match A problem id")
						href = fmt.Sprintf("https://www.moonboard.com/?p=%s", a.Val)
					} else if a.Key == "title" {
						title = a.Val
						if problemId == "220822" {
							title = "maggie mcgeady's untitled miracle"
						}
					}
				}
				bug.On((isPopup && isPound && isProblem) != ((isPopup && isPound) || isProblem), "Inconsistency in Moonboard HTML")
				route.Url = href
				route.Name = title
			}
		} else if tt == html.EndTagToken {
			if !isProblem || z.Token().Data != "div" {
				continue
			}
			bug.On(len(route.Name) == 0, "Found Moonboard problem, failed to parse name")
			bug.On(route.Stars == 10, "Found Moonboard problem, failed to parse number of stars")
			bug.On(len(route.Grade) == 0, "Found Moonboard problem, failed to parse grade")

			existing := d.FindRoute(route.AreaId, route.Name)
			if existing == nil && problemId != "89770" && problemId != "61535" {
				pid, err := strconv.ParseUint(problemId, 10, 64)
				bug.OnError(err)
				route.Length = uint(pid)

				InsertProblem(d, route)
				time.Sleep(100 * time.Millisecond)
				fmt.Printf("Problem"+database.FORMAT_ROUTE, route.Name, route.Type, route.Grade, route.Stars, route.Length, route.Pitches, "TBD", route.Url, route.Comment)
			}

			isProblem = false
			problemId = ""

			route = &database.Route{
				CragId: Id(d),
				AreaId: SetId(d),
				Type:   "moonboard",
				Stars:  10,
			}
		}
	}
}
