require("babel-core/register");
require("babel-polyfill");
import isMobile from "./utils/is-mobile";

/* global d3 */
let NUM_GAMES, START_YEAR, END_YEAR, INTERVAL, GAME_TICK_INTERVAL, DEFAULT_TEAM, PADDING, CIRCLE_SIZE, STAR_SIZE, SEASON_HISTORY, YEAR_INTERVAL, XSCALE, YSCALE, YACCESSOR, YDOMAIN, WRAPPER, BOUNDS, DIMENSIONS
const LEAGUE = 'NBA'

function resize() {
	setConfig(LEAGUE)
	console.log(DIMENSIONS)
	updateSeasonHistoryByMetric(BOUNDS, DIMENSIONS)
}

function init() {
	setConfig(LEAGUE)
	console.log(DIMENSIONS)
	drawSeasonHistory(LEAGUE, WRAPPER, BOUNDS, DIMENSIONS)
	// drawSeasonPaths(LEAGUE)
}

const teamAccessor = d => d.team
const teamParentAccessor = d => d.parent
const dateAccessor = d => new Date(d.date * 1000) //convert to milliseconds
const yearAccessor = d => d.year
const colorAccessor = d => d.primary_color
const secondaryColorAccessor = d => d.secondary_color
const winAccessor = d => d.win
const winPctAccessor = d => d.win_pct
const lossAccessor = d => d.loss
const countAccessor = d => d.count


async function setConfig(league) {
	if (league == 'WNBA') {
		START_YEAR = 1996
		END_YEAR = 2019
		NUM_GAMES = 34
		INTERVAL = 3
		GAME_TICK_INTERVAL = 5
		DEFAULT_TEAM = "Dallas Wings"
		PADDING = 1.5
		CIRCLE_SIZE = 5
		STAR_SIZE = 100
		YEAR_INTERVAL = 5
	} else if (league == 'NBA') {
		START_YEAR = 1946
		END_YEAR = 2020
		NUM_GAMES = 82
		INTERVAL = 10
		GAME_TICK_INTERVAL = 10
		DEFAULT_TEAM = "Atlanta Hawks"
		PADDING = 1
		CIRCLE_SIZE = 5
		STAR_SIZE = 65
		YEAR_INTERVAL = 10
	}

	const wrapperWidth = d3.select("#season-history-wrapper").node().offsetWidth
	const width = wrapperWidth * 0.95
	DIMENSIONS = {
		width: width,
		height: window.innerHeight * .75,
		margin: {
			top: 30,
			right: 0,
			bottom: 30,
			left: 30,
		},
	}
	DIMENSIONS.boundedWidth = DIMENSIONS.width - DIMENSIONS.margin.left - DIMENSIONS.margin.right
	DIMENSIONS.boundedHeight = DIMENSIONS.height - DIMENSIONS.margin.top - DIMENSIONS.margin.bottom

	// 3. Draw Canvas
	console.log(d3.selectAll("#bounds-svg")._groups[0])
	console.log(d3.selectAll("#bounds-svg")._groups[0].length)
	if (d3.selectAll("#wrapper-svg")._groups[0].length === 0) {
		WRAPPER = d3.select("#season-history-wrapper")
			.append("svg")
				.attr("id", "wrapper-svg")
				.style("transform", `translate(${wrapperWidth / 2 - DIMENSIONS.width / 2}px, ${0}px)`)
				.attr("width", DIMENSIONS.width)
				.attr("height", DIMENSIONS.height)
		BOUNDS = WRAPPER.append("g")
			.attr("id", "bounds-g")
			.style("transform", `translate(${DIMENSIONS.margin.left}px, ${DIMENSIONS.margin.top}px)`)
	} else {
		WRAPPER
			.style("transform", `translate(${wrapperWidth / 2 - DIMENSIONS.width / 2}px, ${0}px)`)
			.attr("width", DIMENSIONS.width)
			.attr("height", DIMENSIONS.height)
		// BOUNDS
		// 	.style("transform", `translate(${DIMENSIONS.margin.left}px, ${DIMENSIONS.margin.top}px)`)
	}

	
	console.log(DIMENSIONS)
}

function getNumGames(year, league) {
	if (league === 'WNBA') {
		if (year === 1997) {
			return 28
		} else if (year === 1998) {
			return 30
		} else if (year <= 2002) {
			return 32
		} else if (year <= 2019) {
			return 34
		} else {
			return 36
		}
	} else if (league === 'NBA') {
		// Number of games varied over the first 20 years, stabilized at 82 except for lockouts/covid
		if (year === 1947) {
			return 61
		} else if (year === 1948) {
			return 48
		} else if (year === 1949) {
			return 60
		} else if (year === 1950) {
			return 68
		} else if (year === 1951) {
			return 69
		} else if (year === 1952) {
			return 66
		} else if (year === 1953) {
			return 71
		} else if (year <= 1959) {
			return 72
		} else if (year === 1960) {
			return 75
		} else if (year === 1961) {
			return 79
		} else if (year <= 1966) {
			return 80
		} else if (year === 1967) {
			return 81
		} else if (year === 1999) {
			return 50
		} else if (year === 2012) {
			return 66
		} else if (year === 2020) {
			return 67
		} else {
			return 82
		}
	}
}

async function drawSeasonHistory(league, wrapper, bounds, dimensions) {
  // const boundsBackground = bounds.append("rect")
  //     .attr("class", "bounds-background")
  //     .attr("x", 0)
  //     .attr("width", dimensions.boundedWidth)
  //     .attr("y", 0)
  //     .attr("height", dimensions.boundedHeight)
  	const seasonWinLossData = await d3.json(`./../assets/data/${league}_season_win_loss.json`)
	const teamData = await d3.json(`./../assets/data/${league}_teams.json`)
	YACCESSOR = winPctAccessor
	YDOMAIN = [0, 1]
	drawSeasonHistoryByMetric(league, teamData, seasonWinLossData, bounds, wrapper, dimensions)

	const numGamesButton = d3.select("#toggle-num-games")
	const winPctButton = d3.select("#toggle-win-pct")
	numGamesButton.on("click", onToggleClick)
	winPctButton.on("click", onToggleClick)

	function onToggleClick() {
		const clickedId = d3.select(this).nodes()[0].id
		const clickedButton = clickedId === "toggle-num-games" ? numGamesButton : winPctButton
		const unclickedButton = clickedButton === numGamesButton ? winPctButton : numGamesButton
		clickedButton.style("background-color", "#1b84c911")
		clickedButton.style("border",  "1px solid #1b84c9")
		clickedButton.style("color",  "#1b84c9")
		clickedButton.style("font-weight",  "bold")

		unclickedButton.style("background-color", "white")
		unclickedButton.style("color",  "#83838388")
		unclickedButton.style("font-weight",  "normal")
		unclickedButton.style("border-top",  "1px solid #83838344")
		unclickedButton.style("border-bottom",  "1px solid #83838344")
		if (clickedId === "toggle-num-games") {
			unclickedButton.style("border-left",  "1px solid #83838344")
			unclickedButton.style("border-right",  "0px")
		} else {
			unclickedButton.style("border-left",  "0px")
			unclickedButton.style("border-right",  "1px solid #83838344")
		}

		if (clickedId === "toggle-num-games" && YACCESSOR !== winAccessor) {
			YACCESSOR = winAccessor
			YDOMAIN = [0, NUM_GAMES + 1]
			updateSeasonHistoryByMetric(bounds, dimensions)
		}
		if (clickedId === "toggle-win-pct" && YACCESSOR !== winPctAccessor) {
			YACCESSOR = winPctAccessor
			YDOMAIN = [0, 1]
			updateSeasonHistoryByMetric(bounds, dimensions)
		}
	}
}

function updateSeasonHistoryByMetric(bounds, dimensions) {
	XSCALE = d3.scaleLinear()
		.domain([START_YEAR + 1, END_YEAR])
		.range([0 + 20, dimensions.boundedWidth - 20])
	YSCALE = d3.scaleLinear()
		.domain(YDOMAIN)
		.range([dimensions.boundedHeight, 0])
	const areaGenerator = d3.area()
	    .x(function(d) { return XSCALE(d.year); })
	    .y0(dimensions.boundedHeight)
	    .y1(function(d) { return YSCALE(YACCESSOR(d)); })
	    .curve(d3.curveCatmullRom.alpha(0.5))

	const updatedLineGenerator = d3.line()
		.x(function(d) { return XSCALE(d.year); })
		.y(function(d) { return YSCALE(YACCESSOR(d)); })
		.curve(d3.curveCatmullRom.alpha(0.5))

	const numGamesLineGenerator = d3.line()
		.x(d => XSCALE(d.year))
		.y(d => YSCALE(d.num_games))
		.curve(d3.curveStep)

	if (YDOMAIN[1] === (NUM_GAMES + 1)) {
		bounds.selectAll(".num-games-gridlines")
			.attr("opacity", 1)
			.attr("y", d => YSCALE(d))
			.attr("width", dimensions.boundedWidth)
		bounds.selectAll(".num-games-label")
			.attr("opacity", 1)
			.attr("y", d => YSCALE(d))
		bounds.selectAll(".num-games-year-path")
			.attr("opacity", 1)
			.attr("d", d => numGamesLineGenerator(d))
		bounds.selectAll(".win-pct-gridlines")
			.attr("opacity", 0)
			.attr("width", dimensions.boundedWidth)
		bounds.selectAll(".win-pct-label")
			.attr("opacity", 0)
	} else {
		bounds.selectAll(".num-games-gridlines")
			.attr("opacity", 0)
			.attr("width", dimensions.boundedWidth)
		bounds.selectAll(".num-games-label")
			.attr("opacity", 0)
		bounds.selectAll(".num-games-year-path")
			.attr("opacity", 0)
		bounds.selectAll(".win-pct-gridlines")
			.attr("opacity", 1)
			.attr("y", d => YSCALE(d))
			.attr("width", dimensions.boundedWidth)
		bounds.selectAll(".win-pct-label")
			.attr("opacity", 1)
			.attr("y", d => YSCALE(d))

	}

	bounds.selectAll(".year-label")
		.attr("opacity", 1)
		.attr("x", d => XSCALE(d))
		.attr("y", dimensions.boundedHeight + 20)
	bounds.selectAll(".year-gridline")
		.attr("opacity", 1)
		.attr("x", d => XSCALE(d))
		.attr("height", dimensions.boundedHeight)
	bounds.selectAll(".historical-circle")
	 	.attr("cy", (d) => YSCALE(YACCESSOR(d)))
	bounds.selectAll(".championship-star")
		.attr("transform", d => {
			const x = XSCALE(d.year)
			const y = YSCALE(YACCESSOR(d))
			return `translate(${x},${y})`
		})
	bounds.selectAll(".historical-path")
        .attr("d", d => updatedLineGenerator(d))
    bounds.selectAll(".historical-area")
        .attr("d", d => areaGenerator(d))
}

async function drawSeasonHistoryByMetric(league, teamData, seasonWinLossData, bounds, wrapper, dimensions) {
	if (league === "WNBA") {
		SEASON_HISTORY = [
			[],
			[{
				"team": "Houston Comets",
				"start": 1997,
				"end": 2002,
			}],
			[{
				"team": "Los Angeles Sparks",
				"start": 1999,
				"end": 2003,
			}],
			[{
				"team": "Detroit Shock",
				"start": 2002,
				"end": 2009,
			}],
			[{
				"team": "Seattle Storm",
				"start": 2003,
				"end": 2011,
			}],
			[{
				"team": "Sacramento Monarchs",
				"start": 2004,
				"end": 2008,
			}],
			[{
				"team": "Phoenix Mercury",
				"start": 2006,
				"end": 2010,
			}],
			[{
				"team": "Indiana Fever",
				"start": 2011,
				"end": 2013,
			}],
			[{
				"team": "Phoenix Mercury",
				"start": 2013,
				"end": 2015,
			}],		
			[{
				"team": "Los Angeles Sparks",
				"start": 2015,
				"end": 2019,
			}],
			[{
				"team": "Minnesota Lynx",
				"start": 2010,
				"end": 2018,
			}],
			[{
				"team": "Seattle Storm",
				"start": 2017,
				"end": 2019,
			}],
			[{
				"team": "Washington Mystics",
				"start": 2017,
				"end": 2019,
			}],
			[],	
		]

	} else if (league === "NBA") {
		SEASON_HISTORY = [
			[],
			[{
				"team": "Philadelphia Warriors",
				"start": 1947,
				"end": 1948,
			}],
			[{
				"team": "Baltimore Bullets (Original)",
				"start": 1948,
				"end": 1949,
			}],
			[{
				"team": "Rochester Royals",
				"start": 1949,
				"end": 1954,
			}],
			[{
				"team": "Minneapolis Lakers",
				"start": 1949,
				"end": 1954,
			}],
			[{
				"team": "Syracuse Nationals",
				"start": 1954,
				"end": 1956,
			}],
			[{
				"team": "Philadelphia Warriors",
				"start": 1955,
				"end": 1957,
			}],
			[{
				"team": "St. Louis Hawks",
				"start": 1957,
				"end": 1960,
			}],
			[
				{
					"team": "Philadelphia Warriors",
					"start": 1960,
					"end": 1962,
					"player": "Wilt Chamberlain"
				},
				{
					"team": "San Francisco Warriors",
					"start": 1963,
					"end": 1964,
					"player": "Wilt Chamberlain"
				},
				{
					"team": "Philadelphia 76ers",
					"start": 1965,
					"end": 1969,
					"player": "Wilt Chamberlain"
				},
			],
			[{
				"team": "Boston Celtics",
				"start": 1957,
				"end": 1969,
			}],
			[{
				"team": "New York Knicks",
				"start": 1969,
				"end": 1973,
			}],
			[{
				"team": "Milwaukee Bucks",
				"start": 1970,
				"end": 1974,
			}],
			[{
				"team": "Los Angeles Lakers",
				"start": 1970,
				"end": 1974,
			}],
			[{
				"team": "Golden State Warriors",
				"start": 1973,
				"end": 1976,
			}],
			[{
				"team": "Boston Celtics",
				"start": 1973,
				"end": 1976,
			}],
			[{
				"team": "Philadelphia 76ers",
				"start": 1976,
				"end": 1983,
			}],
			[{
				"team": "Portland Trail Blazers",
				"start": 1976,
				"end": 1979,
			}],
			[{
				"team": "Washington Bullets",
				"start": 1976,
				"end": 1980,
			}],
			[{
				"team": "Seattle Supersonics",
				"start": 1976,
				"end": 1980,
			}],
			[{
				"team": "Boston Celtics",
				"start": 1980,
				"end": 1990,
			}],
			[{
				"team": "Los Angeles Lakers",
				"start": 1980,
				"end": 1990,
			}],
			[{
				"team": "Detroit Pistons",
				"start": 1988,
				"end": 1990,
			}],
			[{
				"team": "Chicago Bulls",
				"start": 1990,
				"end": 1998,
			}],
			[{
				"team": "Houston Rockets",
				"start": 1993,
				"end": 1995,
			}],
			[{
				"team": "San Antonio Spurs",
				"start": 1998,
				"end": 2014,
			}],
			[{
				"team": "Los Angeles Lakers",
				"start": 2000,
				"end": 2010,
			}],
			[{
				"team": "Dallas Mavericks",
				"start": 2006,
				"end": 2011,
			}],
			[{
				"team": "Detroit Pistons",
				"start": 2003,
				"end": 2005,
			}],
			[{
				"team": "Miami Heat",
				"start": 2004,
				"end": 2007,
			}],
			[{
				"team": "Boston Celtics",
				"start": 2007,
				"end": 2011,
			}],
			[
				{
					"team": "Miami Heat",
					"start": 2011,
					"end": 2014,
					"player": "LeBron James"
				},
				{
					"team": "Cleveland Cavaliers",
					"start": 2015,
					"end": 2018,
					"player": "LeBron James"
				},
				{
					"team": "Los Angeles Lakers",
					"start": 2019,
					"end": 2020,
					"player": "LeBron James"
				}
			],
			[{
				"team": "Golden State Warriors",
				"start": 2014,
				"end": 2020,
			}],
			[{
				"team": "Toronto Raptors",
				"start": 2017,
				"end": 2020,
			}],
			[],	
		]
	}
	if (isMobile.any()) {
		d3.select(".intro")
			.style("padding-top", "4.5rem")
		d3.select('.step-outro')
			.style('margin-bottom', 0)
		d3.select("#top-label")
			.style("visibility", "hidden")
			.style("display", "none")
		d3.select("#toggle-win-pct")
			.style("visibility", "hidden")
			.style("display", "none")
		d3.select("#toggle-num-games")
			.style("visibility", "hidden")
			.style("display", "none")
		d3.select(".sticky")
			.style("width", 0)
			.style("height", 0)
			.style("visibility", "hidden")
			.style("display", "none")
		d3.select(".step-intro")
			.style("visibility", "hidden")
			.style("display", "none")
		d3.select(".interactive-div")
			.style("visibility", "hidden")
			.style("display", "none")
		d3.selectAll(".desktop-text")
			.style("visibility", "hidden")
			.style("display", "none")
		d3.selectAll(".mobile-text")
			.style("visibility", "visible")
		d3.select(".article")
			.style("max-width", "100%")
		for (var i = 0; i < SEASON_HISTORY.length; i++) {
			if (SEASON_HISTORY[i].length > 0) {
				const season = SEASON_HISTORY[i][0]
				const team = season['team']
				const player = Object.keys(season).includes('player') ? season['player'] : ''
				const label = player !== '' ? player : team

				let startYear = season['start'].toString().substring(2,4)
				let endYear = season['end'].toString().substring(2,4)
				let primaryColor = teamData[team]['primary_color']
				let secondaryColor = teamData[team]['secondary_color']

				if (player === "LeBron James") {
					primaryColor = teamData['Cleveland Cavaliers']['primary_color']
					secondaryColor = teamData['Cleveland Cavaliers']['secondary_color']
					endYear = 20
				}
				if (player === "Wilt Chamberlain") {
					primaryColor = teamData['Philadelphia 76ers']['primary_color']
					secondaryColor = teamData['Philadelphia 76ers']['secondary_color']
					endYear = 69
				}

				const labelText = `'${startYear} - '${endYear}<br>${label.replace("(Original)", "")}`
				d3.select(`#header-${i}`)
					.html(labelText)
					.style("color", primaryColor)
					.style("border-bottom", `2px solid ${secondaryColor}`)
					.style("margin-bottom", "1rem")
			}
		}
			
		return
		// 0. Update global variables
	}
	const years = getIntervalArray(START_YEAR + 1, END_YEAR, 1)
	const numGames = years.map(year => {
		return {"num_games": getNumGames(year, league), "year": year}
	})
	XSCALE = d3.scaleLinear()
		.domain([START_YEAR + 1, END_YEAR])
		.range([0 + 20, dimensions.boundedWidth - 20])
	YSCALE = d3.scaleLinear()
		.domain(YDOMAIN)
		.range([dimensions.boundedHeight, 0])

	const yearGridlines = bounds.selectAll(".year-gridline")
		.data(years)
		.enter()
		.append("rect")
			.attr("class", "year-gridline")
			.attr("x", d => XSCALE(d))
			.attr("y", d => 0)
			.attr("height", dimensions.boundedHeight)
			.attr("width", 0.5)
			.attr("fill", d => {return d % YEAR_INTERVAL === 0 ? "#838383" : "#e3e3e3"})
			.attr("opacity", 1)
	const yearLabels = bounds.selectAll(".year-label")
		.data(years)
		.enter()
		.append("text")
			.attr("class", "year-label")
			.attr("x", d => XSCALE(d))
			.attr("y", dimensions.boundedHeight + 20)
			.text((d,i) => {
				if (i === 0 || i === (years.length - 1) || d % YEAR_INTERVAL === 0) {
					return d
				}
			})
			.attr("font-size", 12)
			.attr("text-anchor", "middle")
			.attr("fill", d => {return d % YEAR_INTERVAL === 0 ? "black" : "#b5b5b5"})
			.attr("opacity", 1)


	const numGamesLineBreaks = getIntervalArray(0, NUM_GAMES + 1, GAME_TICK_INTERVAL)
	const numGamesGridlines = bounds.selectAll(".num-games-gridlines")
		.data(numGamesLineBreaks)
		.enter()
		.append("rect")
			.attr("class", "num-games-gridlines")
			.attr("x", 0)
			.attr("y", d => YSCALE(d))
			.attr("height", 0.5)
			.attr("width", dimensions.boundedWidth)
			.attr("fill", d => "#e3e3e3")
			.attr("opacity", 0)
	const midPoint = league === 'WNBA' ? 17.5 : 40
	const numGamesMidline = bounds.append("rect")
			.datum(midPoint)
			.attr("class", "num-games-gridlines")
			.attr("x", 0)
			.attr("y", d => YSCALE(d))
			.attr("height", 0.5)
			.attr("width", dimensions.boundedWidth)
			.attr("fill", d => "#838383")
			.attr("opacity", 0)
	const numGamesLabels = bounds.selectAll(".num-games-label")
		.data(numGamesLineBreaks)
		.enter()
		.append("text")
			.attr("class", "num-games-label")
			.attr("x", -10)
			.attr("y", d => YSCALE(d))
			.text(d => d)
			.attr("font-size", 12)
			.attr("text-anchor", "end")
			.attr("opacity", 0)
	const numGamesLineGenerator = d3.line()
		.x(d => XSCALE(d.year))
		.y(d => YSCALE(d.num_games))
		.curve(d3.curveStep)
	const numGamesByYear = bounds.append("path")
	  		.datum(numGames)
			.attr("class", "num-games-year-path")
			.attr("d", d => numGamesLineGenerator(d))
			.attr("fill", "none")
			.attr("stroke-dasharray", "5,5")
			.attr("stroke", "#a5a5a5")
			.attr("stroke-width", 1)
			.attr("opacity", 0)

	const winPctLineBreaks = getIntervalArray(0, 1, 0.1)
	const winPctGridlines = bounds.selectAll(".win-pct-gridlines")
		.data(winPctLineBreaks)
		.enter()
		.append("rect")
			.attr("class", "win-pct-gridlines")
			.attr("x", 0)
			.attr("y", d => YSCALE(d))
			.attr("height", 0.5)
			.attr("width", dimensions.boundedWidth)
			.attr("fill", d => {return d === 0.5 ? "#838383" : "#e3e3e3"})
	const winPctLabels = bounds.selectAll(".win-pct-label")
		.data(winPctLineBreaks)
		.enter()
		.append("text")
			.attr("class", "win-pct-label")
			.attr("x", -10)
			.attr("y", d => YSCALE(Math.round(d * 10) / 10))
			.text(d => {
				return Math.round(d * 10) / 10
			})
			.attr("font-size", 12)
			.attr("text-anchor", "end")

	const seasonLineGenerator = d3.line()
		.x(d => XSCALE(d.year))
		.y(d => YSCALE(YACCESSOR(d)))
		.curve(d3.curveCatmullRom.alpha(0.5))

	const fadeColor = "#282828"
	const fadeGradient = bounds.append("linearGradient")
	      .attr("id", "fadeGradient")
	      .attr("gradientUnits", "userSpaceOnUse")
	      .attr("x1", 0).attr("y1", YSCALE(0.4))
	      .attr("x2", 0).attr("y2", YSCALE(0.75))
	    .selectAll("stop")
	      .data([
	        {offset: "0%", color: `${fadeColor}01`},
	        {offset: "25%", color: `${fadeColor}01`},
	        {offset: "50%", color: `${fadeColor}05`},
	        {offset: "75%", color: `${fadeColor}11`},
	        {offset: "100%", color: `${fadeColor}11`}
	      ])
	    .enter().append("stop")
	      .attr("offset", function(d) { return d.offset; })
	      .attr("stop-color", function(d) { return d.color; })

	const interactiveWrapperWidth = d3.select("#interactive-wrapper").node().offsetWidth
	const interactiveWrapperHeight = d3.select("#interactive-wrapper").node().offsetHeight
	const interactiveWrapper =  d3.select("#interactive-wrapper").append("svg")
		.attr("width", interactiveWrapperWidth)
		.attr("height", interactiveWrapperHeight)

	$('.typeahead').on('focus', function() {
	    $(this).parent().siblings().addClass('active');
	}).on('blur', function() {
	    if (!$(this).val()) {
	        $(this).parent().siblings().removeClass('active');
	    }
	});
	const teams = Object.keys(teamData)
	$('#basketball-team-input').typeahead({
		hint: true,
		highlight: true,
		minLength: 0
	},
	{
		name: 'teams',
		limit: 200,
		source: substringMatcher(teams)
	});

	let visibleFullSeasonPathIds = []
	let visibleTeam = ''
	let teamConfig = []
	let results = []
	$('#basketball-team-input').on('typeahead:selected', function (e, selectedTeam) {
		results = drawSelectedFranchiseHistory(selectedTeam, visibleTeam, visibleFullSeasonPathIds, teamConfig, teamData, seasonWinLossData, league, interactiveWrapper, bounds, dimensions, seasonLineGenerator)
		visibleFullSeasonPathIds = results[0]
		visibleTeam = results[1]
		teamConfig = results[2]
	});

	function updateChart(index, teamData, stage, league) {
		if (index < (SEASON_HISTORY.length - 1)) {	
			updateTopLabel(SEASON_HISTORY[index], teamData, league)
		}
		if (index === 0) {
			if (stage == "exit") {
				hideEraPaths(SEASON_HISTORY[index + 1])
			}
		} else if (index === (SEASON_HISTORY.length - 1)) {
			if (stage === "enter") {
				fadeEraPaths(SEASON_HISTORY[index - 1], teamData)
				d3.select("#top-label")
					.style("display", "none")
				d3.select('#basketball-autocomplete')
					.style("pointer-events", "all")
				d3.select("#basketball-team-input")
					.style('display', 'block')
					.attr('placeholder', '(Choose a team)')
				d3.select("#interactive-wrapper")
					.style("display", "block")
				d3.select("#interactive-wrapper")
					.style("display", "block")
					.style("pointer-events", "all")
				if (teamConfig.length > 0) {
					const currentTeam = $('#basketball-team-input').typeahead('val')
					drawEraPaths(teamConfig, seasonWinLossData, teamData, bounds, dimensions, seasonLineGenerator, currentTeam, 1000, true)
					initBoundsListener(seasonWinLossData, teamData, bounds, dimensions, currentTeam)
				} else {
					d3.select("#basketball-team-input")
						.style('color', 'gray')
						.style("border-bottom", "2px solid gray")
				}
			}
		} else {
			if (stage === "enter") {
				if (index === SEASON_HISTORY.length + 1) {
					d3.select("#interactive-wrapper")
						.style("display", "none")
				}
				if (index < (SEASON_HISTORY.length - 1)) {
					fadeEraPaths(SEASON_HISTORY[index - 1], teamData)
					drawEraPaths(SEASON_HISTORY[index], seasonWinLossData, teamData, bounds, dimensions, seasonLineGenerator, SEASON_HISTORY[index]['team'], 1000, true)			
				}
			}
			if (stage === "exit") {
				if (index === SEASON_HISTORY.length) {
					d3.select("#interactive-wrapper")
						.style("display", "block")
				}
				if (index === (SEASON_HISTORY.length - 2)) {
					bounds.on('mousemove', '')
					bounds.on('mouseleave', '')
					d3.select('.hover-point').style("opacity", 0)
					d3.select('#basketball-autocomplete')
						.style("border-bottom", "none")
						.style("pointer-events", "none")
					d3.select("#basketball-team-input")
						.style('display', 'none')
					d3.select("#interactive-wrapper")
						.style("display", "none")
					d3.select("#top-label")
						.style("display", "block")
					highlightEraPaths(SEASON_HISTORY[index], teamData)
					hideEraPaths(teamConfig)
				} else if (index <= (SEASON_HISTORY.length - 1)) {	
					highlightEraPaths(SEASON_HISTORY[index], teamData)
					hideEraPaths(SEASON_HISTORY[index + 1])
				}
			}
		}
	}

	const container = d3.select('#scrolly-side');
	const stepSel = container.selectAll('*[class^=step]');
	console.log(stepSel)
	enterView({
		selector: stepSel.nodes(),
		offset: 0.5,
		enter: el => {
			const index = +d3.select(el).attr('data-index');
			updateChart(index, teamData, "enter", league);
		},
		exit: el => {
			let index = +d3.select(el).attr('data-index');
			index = Math.max(0, index - 1);
			updateChart(index, teamData, "exit", league);
		}
	});

}


function drawSelectedFranchiseHistory(selectedTeam, visibleTeam, visibleFullSeasonPathIds, teamConfig, teamData, seasonWinLossData, league, interactiveWrapper, bounds, dimensions, seasonLineGenerator, animationTime=1000) {
	const interactiveWrapperWidth = d3.select("#interactive-wrapper").node().offsetWidth
	const interactiveWrapperHeight = d3.select("#interactive-wrapper").node().offsetHeight
	if (selectedTeam !== visibleTeam) {
		for (var i = 0; i < visibleFullSeasonPathIds.length; i++) {
			const visiblePathId = visibleFullSeasonPathIds[i]
			const id = visiblePathId.split("path-")[1]
			const visibleAreaId = `area-${id}`
			d3.select(`#${visibleAreaId}`).remove()
			d3.select(`#${visiblePathId}`).remove()
			d3.selectAll(`*[id^=${id}-star-]`).remove()
		}

		const primaryColor = teamData[selectedTeam]['primary_color']
		const secondaryColor = teamData[selectedTeam]['secondary_color']
		const teamParent = teamData[selectedTeam]['parent']
		let teamHistory = teamData[selectedTeam]['history']
		
		if (teamParent && teamParent !== 'deprecated') {
			teamHistory = teamData[teamParent]['history']
		}
		if (teamHistory) {
			teamConfig = []
			teamHistory = JSON.parse(teamHistory).reverse()
			for (var i = 0; i < teamHistory.length; i++) {
				teamConfig.push({
					"team": teamHistory[i],
					"start": START_YEAR,
					"end": END_YEAR,
				})
			}
		} else {
			teamConfig = [{
				"team": selectedTeam,
				"start": START_YEAR,
				"end": END_YEAR,
			}]	
		}

		d3.selectAll('.team-logo').remove()
		d3.selectAll('.team-label').remove()
		d3.selectAll('.team-record').remove()
		d3.selectAll('.team-separator').remove()
		d3.selectAll('.team-title').remove()
		d3.selectAll('.franchise-header').remove()
		d3.selectAll('.franchise-count').remove()
		d3.selectAll('.franchise-separator').remove()
		d3.selectAll('.franchise-label').remove()
		d3.selectAll('.franchise-highlight').remove()
		d3.selectAll('.hover-point').remove()
		d3.select("#basketball-team-input")
			.style("border-bottom", `2px solid ${secondaryColor}`)
			.style("color", primaryColor)

		const logoSize = 100
		const topMargin = 20
		const initialPadding = 20
		const elementPadding = 50
		const logo = interactiveWrapper.append("svg:image")
			.attr("class", "team-logo")
			.attr("xlink:href", `./../assets/images/logos/${league}/${selectedTeam}.png`)
			.attr("width", logoSize)
			.attr("height", logoSize)
			.style("justify-content", "center")
			.attr("x", interactiveWrapperWidth / 2 - logoSize / 2)
			.attr("y", topMargin)
			.attr("opacity", 1)

		let teamWinLossData = seasonWinLossData.filter(d => d.team === selectedTeam)
		// Franchise History
		// if (teamHistory) {
		// 	teamWinLossData = seasonWinLossData.filter(d => teamHistory.includes(d.selectedTeam))
		// }
		const teamWins = teamWinLossData.map(d => d.win)
		const teamWinPct = teamWinLossData.map(d => d.win_pct)
		const bestSeasonIndex = teamWinPct.indexOf(Math.max(...teamWinPct))
		const worstSeasonIndex = teamWinPct.indexOf(Math.min(...teamWinPct))

		const bestSeasonSeparatorWidth = 145
		const bestSeasonHeader = interactiveWrapper.append("text")
			.attr("class", "team-label")
			.html(`Best Record`)
			.attr("x", interactiveWrapperWidth / 2 - bestSeasonSeparatorWidth / 2)
			.style("font-family", "Avenir")
			.attr("y", topMargin + logoSize + initialPadding + 10)
		const bestSeasonYear = interactiveWrapper.append("text")
			.attr("class", "team-record")
			.style("font-family", "Avenir")
			.style("fill", "#888888")
			.style("font-size", "14px")
			.html(`(${teamWinLossData[bestSeasonIndex]['year']})`)
			.attr("x", interactiveWrapperWidth / 2 - bestSeasonSeparatorWidth / 2 + 104)
			.attr("y", topMargin + logoSize + initialPadding + 10)
		const bestSeasonSeparator = interactiveWrapper.append("rect")
			.attr("class", "team-separator")
			.attr("x", interactiveWrapperWidth / 2 - bestSeasonSeparatorWidth / 2)
			.attr("width", bestSeasonSeparatorWidth)
			.attr("y", topMargin + logoSize + initialPadding + 10 + 6)
			.attr("height", 1)
			.attr("fill", `${secondaryColor}`)
		const bestSeasonLabel = interactiveWrapper.append("text")
			.attr("class", "team-record")
			.html(`${teamWinLossData[bestSeasonIndex]['win']} - ${teamWinLossData[bestSeasonIndex]['loss']}`)
			.attr("x", interactiveWrapperWidth / 2)
			.style("font-family", "Avenir")
			.style("text-anchor", "middle")
			.attr("y", topMargin + logoSize + initialPadding + 45)

		const worstSeasonSeparatorWidth = 155
		const worstSeasonHeader = interactiveWrapper.append("text")
			.attr("class", "team-label")
			.html("Worst Record")
			.attr("x", interactiveWrapperWidth / 2 - worstSeasonSeparatorWidth / 2)
			.style("font-family", "Avenir")
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding)
		const worstSeasonYear = interactiveWrapper.append("text")
			.attr("class", "team-record")
			.style("font-family", "Avenir")
			.style("fill", "#888888")
			.style("font-size", "14px")
			.html(`(${teamWinLossData[worstSeasonIndex]['year']})`)
			.attr("x", interactiveWrapperWidth / 2 - worstSeasonSeparatorWidth / 2 + 115)
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding)
		const worstSeasonSeparator = interactiveWrapper.append("rect")
			.attr("class", "team-separator")
			.attr("x", interactiveWrapperWidth / 2  - worstSeasonSeparatorWidth / 2)
			.attr("width", worstSeasonSeparatorWidth)
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 6)
			.attr("height", 1)
			.attr("fill", `${secondaryColor}`)
		const worstSeasonLabel = interactiveWrapper.append("text")
			.attr("class", "team-record")
			.style("font-family", "Avenir")
			.html(`${teamWinLossData[worstSeasonIndex]['win']} - ${teamWinLossData[worstSeasonIndex]['loss']}`)
			.attr("x", interactiveWrapperWidth / 2)
			.style("text-anchor", "middle")
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35)




		teamHistory = teamHistory ? teamHistory : [selectedTeam]
		const numTeams = teamHistory.length
		let franchisePadding = 0
		const franchiseLabelPadding = 30
		franchisePadding = elementPadding + 35 + (numTeams - 1) * franchiseLabelPadding
		const franchiseSeparatorWidth = 155

		const franchiseHeader = interactiveWrapper.append("text")
			.attr("class", "franchise-header")
			.html("Franchise Teams")
			.attr("x", interactiveWrapperWidth / 2 - franchiseSeparatorWidth / 2)
			.style("font-family", "Avenir")
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding)
		const franchiseCount = interactiveWrapper.append("text")
			.attr("class", "franchise-count")
			.style("font-family", "Avenir")
			.style("fill", "#888888")
			.style("font-size", "14px")
			.html(`(${numTeams})`)
			.attr("x", interactiveWrapperWidth / 2 - franchiseSeparatorWidth / 2 + (franchiseSeparatorWidth - 17))
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding)
		const franchiseSeparator = interactiveWrapper.append("rect")
			.attr("class", "franchise-separator")
			.attr("x", interactiveWrapperWidth / 2  - franchiseSeparatorWidth / 2)
			.attr("width", franchiseSeparatorWidth)
			.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + 6)
			.attr("height", 1)
			.attr("fill", `${secondaryColor}`)
		const franchiseLabels = interactiveWrapper.selectAll(".franchise-label")
			.data(teamHistory.reverse())
			.enter()
			.append("text")
				.attr("class", "franchise-label")
				.style("font-family", "Avenir")
				.style("font-size", "18px")
				.text(d => {
					const teamYears = seasonWinLossData.filter(s => s.team === d).map(y => y.year)
					const teamStartYear = `'${(d3.min(teamYears) - 1).toString().substring(2,4)}`
					let teamEndYear = d3.max(teamYears) === END_YEAR ? 'Now' : `'${d3.max(teamYears).toString().substring(2,4)}`
					return `${d.replace(' (Original)', '')} (${teamStartYear} - ${teamEndYear})`
				})
				.attr("x", interactiveWrapperWidth / 2)
				.style("text-anchor", "middle")
				.style("border", "1 px blue")
				.style("fill", d => d === selectedTeam ? "black" : "#d8d8d8")
				.attr("y", (d,i) => topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + 35 + i*franchiseLabelPadding)
		if (numTeams > 1) {
			const activeFranchiseLabel = franchiseLabels.filter(d => d === selectedTeam)
			activeFranchiseLabel.style("fill", primaryColor)
			const activeFranchiseBbox = activeFranchiseLabel.node().getBBox()
			const franchiseMarginX = 20
			const franchiseMarginY = 2
			const franchiseHighlight = interactiveWrapper.append("rect")
					.attr("class", "franchise-highlight")
					.attr('x', activeFranchiseBbox.x - franchiseMarginX / 2)
					.attr('y', activeFranchiseBbox.y - franchiseMarginY / 2)
					.attr('rx', 8)
					.attr('width', activeFranchiseBbox.width + franchiseMarginX)
					.attr('height', activeFranchiseBbox.height + franchiseMarginY)
					.attr("fill", `${primaryColor}`)
					.attr("stroke", `${secondaryColor}`)
					.attr("stroke-width", 1)
					.style("fill-opacity", 0.1)
		}

		franchiseLabels.on("click", onFranchiseLabelMouseClick)
		function onFranchiseLabelMouseClick(clickedTeam) {
			if (clickedTeam !== selectedTeam) {
				$('#basketball-team-input').typeahead('val', clickedTeam);
				teamConfig = [{
					"team": clickedTeam,
					"start": START_YEAR,
					"end": END_YEAR,
				}]
				animationTime = 0
				const results = drawSelectedFranchiseHistory(clickedTeam, visibleTeam, visibleFullSeasonPathIds, teamConfig, teamData, seasonWinLossData, league, interactiveWrapper, bounds, dimensions, seasonLineGenerator, animationTime)	
				visibleFullSeasonPathIds = results[0]
				visibleTeam = results[1]
				teamConfig = results[2]
			}
		}

		const championships = teamWinLossData.filter(d => d.is_championship)
		const numChampionships = championships.length
		var chunkedChampionships = []
		if (numChampionships > 0) {
			const championshipYears = championships.map(d => d.year).sort()
			let size = 3
			if (numChampionships > 9) {
				size = 4
			}
			while (championshipYears.length > 0)
			    chunkedChampionships.push(championshipYears.splice(0, size));

			let championshipSeparatorWidth = 145
			let championshipCountOffest = 16
			if (championships.length >= 10) {
				championshipSeparatorWidth = 155
				championshipCountOffest = 25
			}
			const championshipHeader = interactiveWrapper.append("text")
				.attr("class", "team-label")
				.html("Championships")
				.attr("x", interactiveWrapperWidth / 2 - championshipSeparatorWidth / 2)
				.style("font-family", "Avenir")
				.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + franchisePadding)
			const championshipCount = interactiveWrapper.append("text")
				.attr("class", "team-record")
				.style("font-family", "Avenir")
				.style("fill", "#888888")
				.style("font-size", "14px")
				.html(`(${numChampionships})`)
				.attr("x", interactiveWrapperWidth / 2 - championshipSeparatorWidth / 2 + (championshipSeparatorWidth - championshipCountOffest))
				.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + franchisePadding)
			const championshipSeparator = interactiveWrapper.append("rect")
				.attr("class", "team-separator")
				.attr("x", interactiveWrapperWidth / 2  - championshipSeparatorWidth / 2)
				.attr("width", championshipSeparatorWidth)
				.attr("y", topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + franchisePadding + 6)
				.attr("height", 1)
				.attr("fill", `${teamData[selectedTeam]['secondary_color']}`)
			const championshipLabels = interactiveWrapper.selectAll(".team-titles")
				.data(chunkedChampionships)
				.enter()
				.append("text")
					.attr("class", "team-title")
					.style("font-family", "Avenir")
					.text(d => d.join(', '))
					.attr("x", interactiveWrapperWidth / 2)
					.style("text-anchor", "middle")
					.attr("y", (d,i) => topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + franchisePadding + 35 + i*25)
		}

		const finalPosition = topMargin + logoSize + initialPadding + 45 + elementPadding + 35 + elementPadding + franchisePadding + 35 + chunkedChampionships.length*25
		console.log(finalPosition, interactiveWrapperHeight)
		if (finalPosition > (interactiveWrapperHeight - 100)) {
			interactiveWrapper.attr("height", finalPosition + 100)	
		} else {
			interactiveWrapper.attr("height", interactiveWrapperHeight)	
		}

		visibleFullSeasonPathIds = drawEraPaths(teamConfig, seasonWinLossData, teamData, bounds, dimensions, seasonLineGenerator, selectedTeam, animationTime)
		visibleTeam = selectedTeam
		initBoundsListener(seasonWinLossData, teamData, bounds, dimensions, visibleTeam)
	}
	return [visibleFullSeasonPathIds, visibleTeam, teamConfig]
}

function initBoundsListener(seasonWinLossData, teamData, bounds, dimensions, team) {
	const primaryColor = teamData[team]['primary_color']
	const secondaryColor = teamData[team]['secondary_color']
	const teamWinLossData = seasonWinLossData.filter(d => d.team === team)
	const tooltip = d3.select(".tooltip")

	bounds.on('mousemove', onBoundsMouseMove)
	bounds.on('mouseleave', onBoundsMouseLeave)
	bounds.selectAll(".hover-point").remove()

	let hoverPoint = bounds.append("circle")
		.attr("class", "hover-point")
		.attr("r", CIRCLE_SIZE)
		.attr("fill", secondaryColor)
		.attr("stroke", primaryColor)
		.attr("cx", 0)
		.attr("cy", 0)
		.style("opacity", 0)

	function onBoundsMouseMove() {
		const [x,y] = d3.mouse(this)
		const year = Math.round(XSCALE.invert(x))
		const seasonIndex = teamWinLossData.reduce(function (r, d, index, array) {
	        return index && Math.abs(array[r].year - year) < Math.abs(d.year - year) ? r : index;
	    }, -1);
	    const season = teamWinLossData[seasonIndex]
	    hoverPoint = d3.select(".hover-point")
			.attr("fill", secondaryColor)
			.attr("stroke", primaryColor)
			.attr("cx", XSCALE(season.year))
			.attr("cy", YSCALE(YACCESSOR(season)))
			.style("opacity", 1)


		tooltip.select("#year").text(`${season['year'] - 1} - '${(season['year']).toString().substring(2,4)}`)
		tooltip.select("#win-record").text(season['win'])
		tooltip.select("#loss-record").text(season['loss'])
		tooltip.select("#win-pct").text(season['win_pct'])
		const tooltipWidth = parseInt(tooltip.style("width").replace("px", ''))
		const tooltipHeight = parseInt(tooltip.style("height").replace("px", ''))
		tooltip
			.style("transform", `translate(
				${d3.select("#season-history-wrapper").node().offsetWidth / 2 - dimensions.width / 2 + dimensions.margin.left + XSCALE(season.year) - tooltipWidth / 2}px,
				${YSCALE(YACCESSOR(season)) - 75}px)`
			)
			.style("opacity", 1)
			.style("border", `1px solid ${secondaryColor}`)
		d3.select('.tooltip-year').style("border-bottom", `1px solid ${secondaryColor}`)
	}
	function onBoundsMouseLeave() {
		d3.select(".hover-point").style("opacity", 0)
		tooltip.style("opacity", 0)
	}
}

async function updateTopLabel(eraPaths, teamData, league) {
	const firstEraPath = eraPaths[0]
	const lastEraPath = eraPaths[eraPaths.length - 1]
	if (firstEraPath === undefined) {
		d3.select("#top-label")
			.text(`${league} League History`)
			.style("color", "black")
			.style("border-bottom", `2px solid gray`)
	} else {
		const team = firstEraPath['team']
		const player = Object.keys(firstEraPath).includes('player') ? firstEraPath['player'] : ''
		const label = player !== '' ? player : team
		const startYear = firstEraPath['start'].toString().substring(2,4)
		const endYear = lastEraPath['end'].toString().substring(2,4)
		let primaryColor = teamData[team]['primary_color']
		let secondaryColor = teamData[team]['secondary_color']
		if (player === "LeBron James") {
			primaryColor = teamData['Cleveland Cavaliers']['primary_color']
			secondaryColor = teamData['Cleveland Cavaliers']['secondary_color']
		}
		if (player === "Wilt Chamberlain") {
			primaryColor = teamData['Philadelphia 76ers']['primary_color']
			secondaryColor = teamData['Philadelphia 76ers']['secondary_color']
		}

		const labelText = `${label.replace("(Original)", "")} ('${startYear} - '${endYear})`
		d3.select("#top-label")
			.text(labelText)
			.style("color", primaryColor)
			.style("border-bottom", `2px solid ${secondaryColor}`)
	}
}	

function hideEraPaths(eraPaths) {
	for (var i = 0; i < eraPaths.length; i++) {
		const eraPath = eraPaths[i]
		const filterTeam = eraPath["team"]
		const startYear = eraPath["start"]
		const endYear = eraPath["end"]
		const id = `${filterTeam.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
		const pathId = `path-${id}`
		const areaId = `area-${id}`

		d3.select(`#${areaId}`)
			.transition("hide-area")
			.duration(500)
			.style("fill-opacity",0)
		d3.select(`#${pathId}`)
			.transition("hide-line")
			.duration(500)
			.style("opacity", 0)
		d3.selectAll(`*[id^=${id}-star-]`)
			.transition("hide-star")
			.duration(500)
			.style("stroke-opacity", 0)
			.style("opacity", 0)
	}
}

function fadeEraPaths(eraPaths, teamData) {
	const fadeColor = "#d8d8d8"

	for (var i = 0; i < eraPaths.length; i++) {
		const eraPath = eraPaths[i]
		const filterTeam = eraPath["team"]
		const startYear = eraPath["start"]
		const endYear = eraPath["end"]
		const id = `${filterTeam.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
		const pathId = `path-${id}`
		const areaId = `area-${id}`

		d3.select(`#${areaId}`)
			.transition("fade-area")
			.duration(500)
			.style("fill", "url(#fadeGradient)")
		d3.select(`#${pathId}`)
			.transition("fade-line")
			.duration(500)
			.style("stroke", "#eee")
		d3.selectAll(`*[id^=${id}-star-]`)
			.transition("fade-star")
			.duration(500)
			.style("fill", fadeColor)
			.style("stroke", "#d8d8d8")
			.style("stroke-opacity", 0.5)
			.style("opacity", 0.5)
	}
}

function highlightEraPaths(eraPaths, teamData) {
	for (var i = 0; i < eraPaths.length; i++) {
		const eraPath = eraPaths[i]
		const filterTeam = eraPath["team"]
		const startYear = eraPath["start"]
		const endYear = eraPath["end"]
		const id = `${filterTeam.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
		const pathId = `path-${id}`
		const areaId = `area-${id}`

		const primaryColor = teamData[filterTeam]['primary_color']
		const secondaryColor = teamData[filterTeam]['secondary_color']
		const teamGradientId = `team-gradient-${filterTeam.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
		d3.select(`#${areaId}`)
			.transition("highlight-area")
			.duration(500)
			.style("fill", `url(#${teamGradientId})`)
		d3.select(`#${pathId}`)
			.transition("highlight-line")
			.duration(500)
			.style("stroke", primaryColor)
		d3.selectAll(`*[id^=${id}-star-]`)
			.transition("highlight-star")
			.duration(0)
			.style("fill", primaryColor)
			.style("stroke", secondaryColor)
			.style("stroke-opacity", 1)
			.style("opacity", 1)
	}	
}


function drawEraPaths(eraPaths, seasonWinLossData, teamData, bounds, dimensions, seasonLineGenerator, selectedTeam=null, animationTime=1000, shouldStitch=false) {
	const pathIds = []
	const allTeamWinLossData = []
	for (var i = 0; i < eraPaths.length; i++) {
		const eraPath = eraPaths[i]
		const filterTeam = eraPath["team"]
		const startYear = eraPath["start"]
		const endYear = eraPath["end"]
		const isSelectedTeam = selectedTeam !== null ? (filterTeam === selectedTeam)  : true
		const id = `${filterTeam.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
		const pathId = `path-${id}`
		let teamWinLossData = seasonWinLossData.filter(d => d.team === filterTeam && d.year >= startYear && d.year <= endYear)
		if (!shouldStitch && teamWinLossData.length === 1) {
			const priorHalfYear = JSON.parse(JSON.stringify(teamWinLossData[0]));
			priorHalfYear['year'] = parseInt(priorHalfYear['year']) - 0.25

			const latterHalfYear = JSON.parse(JSON.stringify(teamWinLossData[0]));
			latterHalfYear['year'] = parseInt(latterHalfYear['year']) + 0.25

			teamWinLossData = [priorHalfYear, teamWinLossData[0], latterHalfYear]
		}
		allTeamWinLossData.push(JSON.parse(JSON.stringify(teamWinLossData)))

		if (shouldStitch) {
			if (i === 0 && teamWinLossData.length === 1) {
				const priorHalfYear = JSON.parse(JSON.stringify(teamWinLossData[0]));
				priorHalfYear['year'] = parseInt(priorHalfYear['year']) - 1
				teamWinLossData = [priorHalfYear, teamWinLossData[0]]
			}
			if (i > 0) {
				const previousWinLossData = allTeamWinLossData[i - 1]
				const previousSeason = previousWinLossData[previousWinLossData.length - 1]
				previousSeason['team'] = filterTeam
				if (previousSeason['year'] === (teamWinLossData[0]['year'] - 1)) {
					teamWinLossData = [previousSeason].concat(teamWinLossData)
				}
			}
		}

		drawHistoricalPath(id, pathId, filterTeam, teamWinLossData, teamData, bounds, seasonLineGenerator, isSelectedTeam)
		drawHistoricalArea(filterTeam, startYear, endYear, teamWinLossData, teamData, bounds, dimensions, isSelectedTeam, animationTime)
		drawChampionships(id, pathId, filterTeam, teamWinLossData, teamData, bounds, seasonLineGenerator, isSelectedTeam, animationTime)
		pathIds.push(pathId)
	}	
	for (var i = 0; i < pathIds.length; i++) {
		const pathId = pathIds[i]
		animateLine(pathId, animationTime)
	}
	return pathIds
}

function drawHistoricalArea(team, startYear, endYear, teamWinLossData, teamData, bounds, dimensions, isSelectedTeam, animationTime) {
	const areaId = `area-${team.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
	const primaryColor = teamData[team]['primary_color']
	const areaExists = d3.select(`#${areaId}`).nodes().length > 0

	if (!areaExists) {
		const teamGradientId = `team-gradient-${team.replace(/\s+/g, '-').replace(".", "").replace("(","").replace(")","").toLowerCase()}-${startYear}-${endYear}`
		const teamGradientFill = bounds.append("linearGradient")
		      .attr("id", teamGradientId)
		      .attr("gradientUnits", "userSpaceOnUse")
		      .attr("x1", 0).attr("y1", YSCALE(0))
		      .attr("x2", 0).attr("y2", YSCALE(0.8 * YDOMAIN[1]))
		    .selectAll("stop")
		      .data([
		        {offset: "0%", color: `${primaryColor}01`},
		        {offset: "25%", color: `${primaryColor}01`},
		        {offset: "50%", color: `${primaryColor}88`},
		        {offset: "75%", color: `${primaryColor}AA`},
		        {offset: "100%", color: `${primaryColor}FF`}
		      ])
		    .enter().append("stop")
		      .attr("offset", function(d) { return d.offset; })
		      .attr("stop-color", function(d) { return d.color; })

		const fadeColor = "#989898"
		const fadeGradient = bounds.append("linearGradient")
		      .attr("id", "wideFadeGradient")
		      .attr("gradientUnits", "userSpaceOnUse")
		      .attr("x1", 0).attr("y1", YSCALE(0))
		      .attr("x2", 0).attr("y2", YSCALE(0.8 * YDOMAIN[1]))
		    .selectAll("stop")
		      .data([
		        {offset: "0%", color: `${fadeColor}01`},
		        {offset: "25%", color: `${fadeColor}01`},
		        {offset: "50%", color: `${fadeColor}44`},
		        {offset: "75%", color: `${fadeColor}66`},
		        {offset: "100%", color: `${fadeColor}99`}
		      ])
		    .enter().append("stop")
		      .attr("offset", function(d) { return d.offset; })
		      .attr("stop-color", function(d) { return d.color; })


		const area = d3.area()
		    .x(function(d) { return XSCALE(d.year); })
		    .y0(dimensions.boundedHeight)
		    .y1(function(d) { return YSCALE(YACCESSOR(d)); })
		    .curve(d3.curveCatmullRom.alpha(0.5))
		
		bounds.append("path")
	        .datum(teamWinLossData)
	        .attr("class", "historical-area")
	        .style("fill", isSelectedTeam ? `url(#${teamGradientId})` : `url(#wideFadeGradient)`)
	        .style("fill-opacity", 0)
	        .attr("id", areaId)
	        .attr("d", area)
	}
	animateLine(areaId, animationTime)
}

function drawChampionships(id, pathId, filterTeam, teamWinLossData, teamData, bounds, seasonLineGenerator, isSelectedTeam, animationTime) {
	let teamChampionshipStars
	const teamChampionshipWinLossData = teamWinLossData.filter(d => d.is_championship)
	const starsExist = d3.selectAll(`*[id=${id}-star-]`).nodes().length > 0
	const championshipsExist = teamChampionshipWinLossData.length > 0
	const primaryColor = teamData[filterTeam]['primary_color']
	const secondaryColor = teamData[filterTeam]['secondary_color']

	if (championshipsExist) {
		if (!starsExist) {	
			teamChampionshipStars = bounds.selectAll(`*[id=${id}-star-]`)
				.data(teamChampionshipWinLossData)
		  		.enter()
				.append("g")
					.attr("class", "championship-star")
					.attr("id", (d,i) => `${id}-star-${i}`)
					.attr("transform", d => {
						const x = XSCALE(d.year)
						const y = YSCALE(YACCESSOR(d))
						return `translate(${x},${y})`
					})
					.attr("fill", "black")
					.attr("stroke-width", 1)
				.append("path")
					.attr("id", (d,i) => `${id}-star-${i}`)
					.attr("d", d => {return d3.symbol().type(d3.symbolStar).size(STAR_SIZE)()})
					.attr("stroke", isSelectedTeam ? secondaryColor : '#989898')
					.style("fill", isSelectedTeam ? primaryColor : "#d8d8d8")
					.attr("stroke-width", 1.5)
					.style("opacity", 0)
			teamChampionshipStars.transition()
				.duration(animationTime)
				.style("opacity", 1)
		} else {
			teamChampionshipStars = d3.selectAll(`*[id=${id}-star-]`)
			teamChampionshipStars.transition()
				.duration(animationTime)
				.style("fill", isSelectedTeam ? primaryColor : 'none' )
		}
	}
	

}

function drawHistoricalPath(id, pathId, filterTeam, teamWinLossData, teamData, bounds, seasonLineGenerator, isSelectedTeam) {
	let historicalPathCircles, teamChampionshipStars
	const pathExists = d3.select(`#${pathId}`).nodes().length > 0
	const primaryColor = teamData[filterTeam]['primary_color']

	if (!pathExists) {	
		const secondaryColor = teamData[filterTeam]['secondary_color']
	  	const historicalPaths = bounds.append("path")
	  		.datum(teamWinLossData)
			.attr("class", "historical-path")
			.attr("d", d => seasonLineGenerator(d))
			.attr("fill", "none")
			.attr("stroke", d => isSelectedTeam ? primaryColor: "#d8d8d8")
			.attr("stroke-width", 2)
			.attr("opacity", 1)
			.attr("id", pathId)
	}
}


function animateLine(lineId, animationTime) {
	const lineIdString = `#${lineId}`
	const totalLength = d3.select(lineIdString).node().getTotalLength();
	d3.select(lineIdString)
		.style("opacity", 1)
		.style("stroke-width", 2);

	d3.selectAll(lineIdString)
		// Set the line pattern to be an long line followed by an equally long gap
		.attr("stroke-dasharray", totalLength + " " + totalLength)
		// Set the intial starting position so that only the gap is shown by offesetting by the total length of the line
		.attr("stroke-dashoffset", totalLength)
		// Then the following lines transition the line so that the gap is hidden...
		.transition("draw-line")
		.duration(animationTime)
		.style("fill-opacity", 1)
		.attr("stroke-dashoffset", 0)
		.end()

}


function substringMatcher(strs) {
	return function findMatches(q, cb) {
		// an array that will be populated with substring matches
		const matches = [];
		// regex used to determine if a string contains the substring `q`
		const substrRegex = new RegExp(q, 'i');
		// iterate through the pool of strings and for any string that
		// contains the substring `q`, add it to the `matches` array
		for (var i = 0; i < strs.length; i++) {
			const str = strs[i]
			if (substrRegex.test(str)) {
				matches.push(str);
			}
		}
		cb(matches);
	};
};


function range(start, end) {
	const range = Array(end - start + 1).fill().map((_, idx) => start + idx)
  	return range
}

function formatSeasonToDrawPath(seasonData, xScale) {
	const sortedKeys = Object.keys(seasonData).sort()
	const winLossData = []
	for (var i = 0; i < sortedKeys.length; i++) {
		winLossData.push(seasonData[sortedKeys[i]])
	}
	const season = [
		[{"win": 0, "loss": -0.5 + xScale.invert(PADDING / 2)}],
		winLossData,
		[{
			"win": winLossData[winLossData.length - 1]["win"],
			"loss": winLossData[winLossData.length - 1]["loss"] + 0.5 - xScale.invert(PADDING / 2)
		}],
	].flat(1)
	return season
}

function makeColors(primaryColor, numDarker=4, numLighter=4, pctDarker=0.64, pctLighter=0.64) {
	primaryColor = d3.rgb(primaryColor)
	const primaryRed = primaryColor.r
	const primaryGreen = primaryColor.g
	const primaryBlue = primaryColor.b

	const darkScale = [primaryColor]
	const darkRedStep = primaryRed * pctDarker / numDarker
	const darkGreenStep = primaryGreen * pctDarker / numDarker
	const darkBlueStep = primaryBlue * pctDarker / numDarker
	for (var i = 0; i < numDarker; i++) {
		const darkerColor = d3.rgb(
			darkScale[i].r - darkRedStep,
			darkScale[i].g - darkGreenStep,
			darkScale[i].b - darkBlueStep,
		)
		darkScale.push(darkerColor)
	}

	const lightScale = [primaryColor]
	const lightRedStep = (255 - primaryRed) * pctLighter / numLighter
	const lightGreenStep = (255 - primaryGreen) * pctLighter / numLighter
	const lightBlueStep = (255 - primaryBlue) * pctLighter / numLighter
	for (var i = 0; i < numLighter; i++) {
		const lighterColor = d3.rgb(
			lightScale[i].r + lightRedStep,
			lightScale[i].g + lightGreenStep,
			lightScale[i].b + lightBlueStep,
		)
		lightScale.push(lighterColor)
	}

	// Remove 1st element to avoid double inclusion
	darkScale.shift()
	const colorScale = [lightScale.reverse(), darkScale].flat(1);
	return colorScale
}

function getIntervalArray(start, end, intervalLength) {
	const startInterval = Math.floor(start / intervalLength) * intervalLength
	const endInterval = Math.floor(end / intervalLength) * intervalLength
	const numIntervals = Math.ceil((endInterval - startInterval) / intervalLength)
	const intervals = [startInterval]
	for (var i = 0; i < numIntervals; i++) {
		const currentInterval = intervals[i] + intervalLength
		intervals.push(currentInterval)
	}
	return intervals
}


function getEmptyWinLossData(n=NUM_GAMES) {
	const emptyWinLossData = []
	for (var i = 0; i <= n; i++) {
		for (var j = 0; j <= n; j++) {
			if (i + j <= n) {
				emptyWinLossData.push({win: i, loss: j})
			}
		}
	}
	return emptyWinLossData
}

export default { init, resize };
