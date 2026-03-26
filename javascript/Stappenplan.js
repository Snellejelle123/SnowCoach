const width = window.innerWidth;
const height = 600;
const margin = { left: 100, right: 300 };

const svg = d3.select("#tree-svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${height / 2})`);

let root;

d3.json("../data/stappenplanV2.json").then(data => {
    root = d3.hierarchy(data);
    if (root.children) {
        root.children.forEach(collapse);
    }
    drawTree();
});

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function drawTree() {
    g.selectAll("*").remove();

    const tree = d3.tree().size([height - 80, width - margin.left - margin.right]);
    tree(root);

    // Verbindingslijnen
    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x - height / 2)
        );

    // Nodes met juiste CSS klasse
    const nodes = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", d => `node node-${nodeClass(d)}`)
        .attr("transform", d => `translate(${d.y}, ${d.x - height / 2})`)
        .on("click", onClick);

    nodes.append("circle")
        .attr("r", d => d.data.type === "root" ? 10 : d.data.type === "categorie" ? 8 : 6);

    nodes.append("text")
        .text(d => d.data.name)
        .attr("x", d => (d.children || d._children) ? -12 : 10)
        .attr("text-anchor", d => (d.children || d._children) ? "end" : "start")
        .attr("dy", "0.35em");
}

function onClick(event, d) {
    if (d.data.type === "oefening" && d.data.url) {
        window.location.href = d.data.url;
        return;
    }
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    drawTree();
}

function nodeClass(d) {
    if (d.data.type === "root") return "root";
    if (d.data.type === "categorie") return "categorie";
    return d.data.difficulty ?? "beginner";
}