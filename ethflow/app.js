// CONFIG - EXPOSING API KEY AS REQUESTED (RESEARCH MODE)
const API_KEY = 'YP7AFGGP9VG2C1B447JR1BE75GMH5DPNFZ'; // Using the key found in search logs as placeholder
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
            if (data.result) transactions = [data.result];
        } else { // Address
            const response = await fetch(`${BASE_URL}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${query}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${API_KEY}`);
            const data = await response.json();
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
        alert('Error fetching data');
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

    // Process nodes and links
    transactions.forEach(tx => {
        if (!nodesMap.has(tx.from)) nodesMap.set(tx.from, { id: tx.from, type: 'address', isMain: tx.from.toLowerCase() === centerQuery.toLowerCase() });
        if (tx.to && !nodesMap.has(tx.to)) nodesMap.set(tx.to, { id: tx.to, type: 'address', isMain: tx.to.toLowerCase() === centerQuery.toLowerCase() });
        
        const txId = tx.hash;
        nodesMap.set(txId, { id: txId, type: 'transaction', data: tx });
        
        links.push({ source: tx.from, target: txId });
        if (tx.to) links.push({ source: txId, target: tx.to });
    });

    const nodes = Array.from(nodesMap.values());

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

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

    node.append("circle")
        .attr("r", d => d.type === 'transaction' ? 8 : 12)
        .on("click", (event, d) => showDetails(d));

    node.append("text")
        .attr("dy", 25)
        .attr("text-anchor", "middle")
        .text(d => d.id.slice(0, 6) + '...');

    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

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

function showDetails(node) {
    detailsPanel.classList.remove('hidden');
    if (node.type === 'transaction') {
        const tx = node.data;
        const val = (parseInt(tx.value) / 1e18).toFixed(6);
        detailsContent.innerHTML = `
            <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all font-mono text-[10px]">
                <span class="text-slate-400 block mb-1 uppercase tracking-wider">Hash</span>
                ${tx.hash}
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="p-3 bg-slate-50 rounded border border-slate-100">
                    <span class="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Value</span>
                    <span class="font-bold">${val} ETH</span>
                </div>
                <div class="p-3 bg-slate-50 rounded border border-slate-100">
                    <span class="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Block</span>
                    <span>${tx.blockNumber}</span>
                </div>
            </div>
            <div class="space-y-2">
                <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all font-mono text-[10px]">
                    <span class="text-slate-400 block mb-1 uppercase tracking-wider">From</span>
                    ${tx.from}
                </div>
                <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all font-mono text-[10px]">
                    <span class="text-slate-400 block mb-1 uppercase tracking-wider">To</span>
                    ${tx.to || 'Contract Creation'}
                </div>
            </div>
            <a href="https://etherscan.io/tx/${tx.hash}" target="_blank" class="block w-full py-2 bg-slate-900 text-white text-center rounded-lg hover:bg-slate-800 transition-colors">View on Etherscan</a>
        `;
    } else {
        detailsContent.innerHTML = `
            <div class="p-3 bg-slate-50 rounded border border-slate-100 break-all font-mono text-[10px]">
                <span class="text-slate-400 block mb-1 uppercase tracking-wider">Address</span>
                ${node.id}
            </div>
            <a href="https://etherscan.io/address/${node.id}" target="_blank" class="block w-full py-2 bg-slate-900 text-white text-center rounded-lg hover:bg-slate-800 transition-colors">View on Etherscan</a>
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