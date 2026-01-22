// CONFIG - EXPOSING API KEY AS REQUESTED (RESEARCH MODE)
const API_KEY = 'X6YJNFA98WA325J8IBP4PUSUHYHFWIGUJW'; // New V2 API key
const BASE_URL = 'https://api.etherscan.io/v2/api';
const CHAIN_ID = 1;

// State
let currentQuery = '';
let simulation;
let svg, g;

// Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const detailsPanel = document.getElementById('details-panel');
const detailsContent = document.getElementById('details-content');
const emptyState = document.getElementById('empty-state');
const loader = document.getElementById('loader');
const graphContainer = document.getElementById('graph-container');

// Init D3
function initD3() {
    graphContainer.innerHTML = '';
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;

    svg = d3.select("#graph-container")
        .append("svg")
        .attr("viewBox", [0, 0, width, height]);

    g = svg.append("g");

    // Arrow marker
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class", "link-arrow");

    const zoom = d3.zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    document.getElementById('zoomIn').onclick = () => svg.transition().call(zoom.scaleBy, 1.2);
    document.getElementById('zoomOut').onclick = () => svg.transition().call(zoom.scaleBy, 0.8);
    document.getElementById('resetZoom').onclick = () => svg.transition().call(zoom.transform, d3.zoomIdentity);
}

// Fetch Data
async function fetchData(query) {
    loader.classList.remove('hidden');
    try {
        let transactions = [];
        if (query.length === 66) { // Tx Hash
            const response = await fetch(`${BASE_URL}?chainid=${CHAIN_ID}&module=proxy&action=eth_getTransactionByHash&txhash=${query}&apikey=${API_KEY}`);
            const data = await response.json();
            if (data.status === "0") {
                alert(data.result);
                return;
            }
            if (data.result) transactions = [data.result];
        } else { // Address
            const response = await fetch(`${BASE_URL}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${query}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${API_KEY}`);
            const data = await response.json();
            if (data.status === "0") {
                alert(data.result);
                return;
            }
            if (data.status === "1") transactions = data.result;
        }

        if (transactions.length > 0) {
            renderGraph(transactions, query);
            emptyState.classList.add('hidden');
        } else {
            alert('No transactions found');
        }
    } catch (err) {
        console.error(err);
        alert(`Error fetching data: ${err.message}`);
    } finally {
        loader.classList.add('hidden');
    }
}

function renderGraph(transactions, centerQuery) {
    initD3();
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;

    const nodesMap = new Map();
    const links = [];

    // Sort and take last 10 transactions
    const relevantTx = transactions
        .sort((a, b) => parseInt(b.blockNumber) - parseInt(a.blockNumber))
        .slice(0, 10);

    // Process nodes and links
    relevantTx.forEach(tx => {
        if (!nodesMap.has(tx.from)) nodesMap.set(tx.from, { id: tx.from, type: 'address', isMain: tx.from.toLowerCase() === centerQuery.toLowerCase() });
        if (tx.to && !nodesMap.has(tx.to)) nodesMap.set(tx.to, { id: tx.to, type: 'address', isMain: tx.to.toLowerCase() === centerQuery.toLowerCase() });

        const txId = tx.hash;
        nodesMap.set(txId, { id: txId, type: 'transaction', data: tx });

        // Reverse arrows to point to source
        links.push({ source: txId, target: tx.from });
        if (tx.to) links.push({ source: txId, target: tx.to });
    });

    const nodes = Array.from(nodesMap.values());

    // Initial positions
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 200;
    const angleStep = (2 * Math.PI) / (nodes.length - 1);

    nodes.forEach((node, i) => {
        if (node.isMain) {
            node.x = centerX;
            node.y = centerY;
        } else {
            const angle = (i - 1) * angleStep;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        }
    });

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-100)) // Reduced strength to less wiggly
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alphaDecay(0.05) // Faster decay to stabilize
        .alphaMin(0.01); // Stop when stable

    const link = g.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
        .selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", d => `node ${d.type} ${d.isMain ? 'main' : ''}`)
        .call(drag(simulation));

    node.append("rect")
        .attr("width", d => d.type === 'transaction' ? 60 : 80)
        .attr("height", 30)
        .attr("x", d => d.type === 'transaction' ? -30 : -40)
        .attr("y", -15)
        .attr("rx", 5)
        .on("click", (event, d) => showDetails(d));

    node.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text(d => d.id.slice(0, 6) + '...');

    simulation.on("tick", () => {
        link.attr("d", d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function downloadPDF() {
    html2canvas(graphContainer, { useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF();
        const imgWidth = 190; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save('transaction-flow.pdf');
    }).catch(err => console.error('PDF generation error:', err));
}

function showDetails(node) {
    detailsPanel.classList.remove('hidden');
    if (node.type === 'transaction') {
        const tx = node.data;
        const val = (parseInt(tx.value) / 1e18).toFixed(6);
        detailsContent.innerHTML = `
            <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all text-sm">
                <span class="text-slate-600 block mb-2 font-semibold">Hash</span>
                <span class="font-mono text-xs">${tx.hash}</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="p-3 bg-slate-50 rounded border border-slate-100">
                    <span class="text-slate-600 block mb-2 font-semibold">Value</span>
                    <span class="font-bold text-lg">${val} ETH</span>
                </div>
                <div class="p-3 bg-slate-50 rounded border border-slate-100">
                    <span class="text-slate-600 block mb-2 font-semibold">Block</span>
                    <span class="text-lg">${tx.blockNumber}</span>
                </div>
            </div>
            <div class="space-y-2">
                <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all text-sm">
                    <span class="text-slate-600 block mb-2 font-semibold">From</span>
                    <span class="font-mono text-xs">${tx.from}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all text-sm">
                    <span class="text-slate-600 block mb-2 font-semibold">To</span>
                    <span class="font-mono text-xs">${tx.to || 'Contract Creation'}</span>
                </div>
            </div>
            <button onclick="downloadPDF()" class="block w-full py-3 bg-slate-900 text-white text-center rounded-lg hover:bg-slate-800 transition-colors font-semibold">Download as PDF</button>
        `;
    } else {
        detailsContent.innerHTML = `
            <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all text-sm">
                <span class="text-slate-600 block mb-2 font-semibold">Address</span>
                <span class="font-mono text-xs">${node.id}</span>
            </div>
            <button onclick="downloadPDF()" class="block w-full py-3 bg-slate-900 text-white text-center rounded-lg hover:bg-slate-800 transition-colors font-semibold">Download as PDF</button>
        `;
    }
}

searchBtn.onclick = () => {
    const val = searchInput.value.trim();
    if (val) fetchData(val);
};

searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') searchBtn.click();
};

window.onresize = () => {
    if (svg) {
        const width = graphContainer.clientWidth;
        const height = graphContainer.clientHeight;
        svg.attr("viewBox", [0, 0, width, height]);
    }
};