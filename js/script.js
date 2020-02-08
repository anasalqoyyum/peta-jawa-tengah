var width = 1920,
  height = 1080,
  centered,
  populationDomain;

var colorRange = ["#532E26", "#9E4825", "#E07A26", "#F2B526", "#EDE626", "#E4FD7E", "#9CDA9B", "#55A252", "#26622F"];
var populationDomain = [0, 21, 51, 101, 151, 201, 301, 401, 501];

// var ipm = d3.map();

// var averageIPM = 0;

// var color = d3.scaleThreshold()
//   .domain(d3.range(2, 10))
//   .range(d3.schemeGreens[9]);

// Projection and path
var projection = d3.geoMercator()
  .center([110, -7.5])
  .scale(width * 12)
  .translate([width / 2, height / 2]);

var path = d3.geoPath()
  .projection(projection);

// Create SVG element
var svg = d3.select("body")
  .insert("svg", "p")
  .attr("width", width)
  .attr("height", height * 0.8)

svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", clicked);

var g = svg.append("g");

var populationData = {};

// Asynchronous tasks, load topojson map and data
d3.queue()
  .defer(d3.json, "data/jawa-tengah-topo.json")
  .defer(d3.csv, "data/data.csv")
  .await(ready);

// Callback function
function ready(error, data, population) {
  if (error) throw error;

  // population data

  population.forEach(function (d) { populationData[d.id] = +d.population; });

  // Color
  var populationColor = d3.scaleThreshold()
    .domain(populationDomain)
    .range(colorRange);

  // Draw the map
  g.append("g")
    .attr("id", "subunits")
    .selectAll("path")
    .data(topojson.feature(data, data.objects.jawatengah).features)
    .enter()
    .append("path")
    .attr("stroke", "black")
    .attr("stroke-width", "0.2")
    .attr("fill", function (d) {
      return populationColor(populationData[d.properties.kabkot]);
    })
    .attr("d", path)
    .on("click", clicked);

  g.append("path")
    .datum(topojson.mesh(data, data.objects.jawatengah, function (a, b) { return a !== b; }))
    .attr("id", "state-borders")
    .attr("d", path);

  // g.selectAll("path")
  //   .append("title")
  //   .text(function (d) {
  //     return d.properties.kabkot + " : " + populationData[d.properties.kabkot];
  //   });
}

d3.select(window).on("resize", resize);

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;

  projection.scale(width * 12)
    .translate([width / 2, height / 2]);

  d3.select("svg")
    .attr("width", width)
    .attr("height", height * 0.8);

  d3.selectAll("path")
    .attr("d", path);
}

function regionName(region) {
  return region.properties.kabkot.toUpperCase() + " : " + populationData[region.properties.kabkot];
}

function clicked(d) {
  var x, y, k;

  if(d) {
    console.log(d.properties);
    document.getElementById('info-details').innerHTML = regionName(d) + " mm";
  }

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
    .classed("active", centered && function (d) { return d === centered; });

  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .style("stroke-width", 1.5 / k + "px");
}