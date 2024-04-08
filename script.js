// Async function to fetch CSV data
async function fetchData() {
    const response = await fetch('./nutrition.csv');
    const data = await response.text();
    return data;
}

// Create scatterplot function
function createScatterplot(data, svgId, xAttribute, yAttribute, plotTitle) {
    // Parse CSV data with headers and auto type detection
    const parsedData = d3.csvParse(data, d3.autoType);

    // Filter out data points from 'Processed Foods' and 'Soups, Sauces, and Gravies' MajorGroup
    const filteredData = parsedData.filter(d => d.MajorGroup !== 'Processed Foods' && d.MajorGroup !== 'Soups, Sauces, and Gravies');

    // Select the SVG container
    const svg = d3.select(`#${svgId}`);

    // Extract x and y values from the filtered data
    const xValues = filteredData.map(d => d[xAttribute]);
    const yValues = filteredData.map(d => d[yAttribute]);

    // Set up SVG dimensions
    const margin = { top: 50, right: 20, bottom: 30, left: 40 }; // Adjusted top margin
    const width = +svg.attr('width') - margin.left - margin.right;
    const height = +svg.attr('height') - margin.top - margin.bottom;

    // Define maximum domain values for each axis based on the scatterplot
    let maxXDomain, maxYDomain;

    switch (plotTitle) {
        case 'Iron & Vitamin C':
            maxXDomain = 50;
            maxYDomain = 500;
            break;
        case 'Magnesium & Potassium':
            maxXDomain = 1000;
            maxYDomain = 1000;
            break;
        case 'Fiber & Water':
            maxXDomain = 50;
            maxYDomain = 1000;
            break;
        case 'Vitamin A & Zinc':
            maxXDomain = 100000;
            maxYDomain = 100;
            break;
        case 'Vitamin C & Vitamin E':
        default:
            maxXDomain = 500;
            maxYDomain = 100;
            break;
    }

    // Create scales for x and y axes with custom maximum domain values
    const xScale = d3.scaleLinear().domain([0, maxXDomain]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, maxYDomain]).range([height, 0]);

    // Create SVG group element
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Add x-axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('fill', '#000')
        .attr('x', width)
        .attr('y', -6)
        .attr('text-anchor', 'end')
        .text(xAttribute);

    // Add y-axis
    g.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text(yAttribute);

    // Add circles for data points
    g.selectAll('.dot')
        .data(filteredData)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d[xAttribute]))
        .attr('cy', d => yScale(d[yAttribute]))
        .attr('r', 5) // Increased radius for better interaction
        .style('fill', '#E1AD01')
        .style('opacity', 0.6)
        .on('mouseover', function (event, d) {
            // Change color and increase size on hover
            d3.select(this).style('fill', '#1F3D0C').attr('r', 10);

            const mouseX = event.pageX; // absolute x position of mouse
            const mouseY = event.pageY; // absolute y position of mouse

            // Show tooltip next to the point being hovered over
            tooltip
                .transition()
                .duration(200)
                .style('opacity', 0.9)
                .style('left', mouseX - 150 + 'px') // position right next to the point
                .style('top', mouseY - 10 + 'px'); // slightly above the point

            // Populate tooltip content
            tooltip.html(
                `<strong>${d.Short_Desc}</strong><br>${xAttribute}: ${d[xAttribute]}<br>${yAttribute}: ${d[yAttribute]}<br>Amount: ${d.GmWt_Desc1}`
            );
        })
        .on('mouseout', function (event, d) {
            // Revert color and size when hover moves away
            d3.select(this).style('fill', '#E1AD01').attr('r', 5);

            // Hide the tooltip
            tooltip.transition().duration(500).style('opacity', 0);
        });

    // Add plot title with specified font family
    svg
        .append('text')
        .attr('x', width / 2 + margin.left) // Adjusted x position
        .attr('y', margin.top / 2) // Adjusted y position
        .attr('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('font-family', "'Copperplate', sans-serif") // Specify font family
        .text(plotTitle);
}


// Function to detect the active section based on scroll position
function detectActiveSection(offset) {
    const sections = document.querySelectorAll('.section');
    let activeSection = null;
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * offset && rect.bottom >= window.innerHeight * offset) {
            activeSection = section.id;
        }
    });
    return activeSection;
}

// Function to update scatterplot based on active section
function updateScatterplot() {
    const activeSection = detectActiveSection(0.4);
    const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;

    if (activeSection) {
        // Remove existing scatterplot
        d3.select('#scatterplot').selectAll('*').remove();

        switch (activeSection) {
            case 'section1':
                createScatterplot(data, 'scatterplot', 'Iron_per', 'Vit_C_per', 'Iron & Vitamin C');
                break;
            case 'section2':
                createScatterplot(data, 'scatterplot', 'Magnesium_per', 'Potassium_per', 'Magnesium & Potassium');
                break;
            case 'section3':
                createScatterplot(data, 'scatterplot', 'Fiber_TD_per', 'Water_per', 'Fiber & Water');
                break;
            case 'section4':
                createScatterplot(data, 'scatterplot', 'Vit_A_per', 'Zinc_per', 'Vitamin A & Zinc');
                break;
            case 'section5':
            default:
                createScatterplot(data, 'scatterplot', 'Vit_C_per', 'Vit_E_per', 'Vitamin C & Vitamin E');
                break;
        }
    } else if (isBottom) {
        // If scrolled to the bottom of the page, show the last plot
        d3.select('#scatterplot').selectAll('*').remove(); // Remove existing scatterplot
        createScatterplot(data, 'scatterplot', 'Vit_C_per', 'Vit_E_per', 'Vitamin C & Vitamin E');
    }
}

// Fetch data and create scatterplot initially
fetchData().then(data => {
    // Initial creation of scatterplot
    createScatterplot(data, 'scatterplot', 'Iron_per', 'Vit_C_per', 'Iron & Vitamin C');

    // Listen for scroll events
    window.addEventListener('scroll', function () {
        updateScatterplot(data);
    });
});

// Listen for scroll events
window.addEventListener('scroll', function () {
    updateScatterplot();
});

// Create tooltip element
const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('padding', '10px')
    .style('border-radius', '5px')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.1)')
    .style('pointer-events', 'none'); // Ensure tooltip doesn't block hover events on data points
