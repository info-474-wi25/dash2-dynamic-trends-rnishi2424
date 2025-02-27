// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svgLine = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("aircraft_incidents.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    // check data column
    // console.log(typeof data[0].Event_Date);

    data.forEach(d => {
        d.year = new Date(d.Event_Date).getFullYear();
        d.fatalities = +d.Total_Fatal_Injuries;
        d.manufacturer = d.Make;
    });

    // checks
    console.log("Raw data:", data);

    const groupedData = d3.groups(data, d=>d.manufacturer, d=>d.year)
        .map(([manufacturer, year]) => ({
            manufacturer,
            values: year.map(([year, entries]) => ({
                year,
                totalFatalities: d3.sum(entries, e=>e.fatalities)
            }))
        }));

    // check
    console.log("Grouped data:", groupedData);

    const flattenedData = groupedData.flatMap(({manufacturer, values}) =>
        values.map(({year, totalFatalities}) => ({
            year,
            totalFatalities,
            manufacturer
        })));

    // sort years into order
    flattenedData.sort((a, b) => a.year - b.year);
    
    // // check:
    console.log("Final flattened data:", flattenedData);
    console.log("------------------------------------------------------------------");


    // 3.a: SET SCALES FOR CHART 1
    // Groups: manufacturer
    const manufacturers = [...new Set(flattenedData.map(d => d.manufacturer))];

    // X scale: year
    const years = [...new Set(flattenedData.map(d => d.year))];

    console.log("Year Range:", d3.extent(years));

    const xScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, width]);

    // Y scale: total fatalities
    const allFatalities = [...new Set(flattenedData.map(d => d.totalFatalities))];
    const maxCount = d3.max(allFatalities);

    console.log("Max Fatalities:", maxCount);

    const yScale = d3.scaleLinear()
        .domain([0, maxCount + 1])
        .range([height, 0]);


    // 4.a: PLOT DATA FOR CHART 1
    // line generator
    const line = d3.line()
        .x(d => xScale(d.year))  // Using year for x position
        .y(d => yScale(d.totalFatalities)); // Using count for y position
    
    // color scheme
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // group data by manufacturer
    manufacturers.forEach(manufacturer => {
        const manufacturerData = flattenedData.filter(d => d.manufacturer === manufacturer);

        svgLine.append("path")
            .datum(manufacturerData)
            .attr("fill", "none")
            .attr("stroke", color(manufacturer))
            .attr("stroke-width", 2)
            .attr("d", line);
    });

    // 5.a: ADD AXES FOR CHART 1
    // X-axis
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
        .tickFormat(d3.format("d"))); // Format the x-axis as years

    // Y-axis
    svgLine.append("g")
        .call(d3.axisLeft(yScale));


    // 6.a: ADD LABELS FOR CHART 1
    // X-axis label.
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text("Year");

    // Y-axis label
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Total Fatal Injuries");
        
    // legend
    const legend = svgLine.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right - 100}, ${margin.top - 50})`);

    // legend Row
    manufacturers.forEach((manufacturer, i) => {
        const legendRow = legend.append("g")
            .attr("class", "legend-row")
            .attr("transform", `translate(0, ${i * 20})`);

        // legend color box
        legendRow.append("rect")
            .attr("class", "legend-color-box")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(manufacturer));

        // legend text
        legendRow.append("text")
            .attr("class", "legend-text")
            .attr("x", 20)
            .attr("y", 8)
            .attr("font-size", "12px")
            .attr("fill", "#666")
            .style("alignment-baseline", "middle")
            .text(manufacturer);
    });

    // 7.a: ADD INTERACTIVITY FOR CHART 1
});