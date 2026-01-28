// Material Design Ethereum Transaction Flow Visualization with Cytoscape.js
// CONFIG - Etherscan API
const API_KEY = 'ZGF2297Q9RPES9CS6D7YRWK53FJFEZJY42';
const BASE_URL = 'https://api.etherscan.io/v2/api';
const CHAIN_ID = 1;

// Global state
let currentQuery = '';
let cy; // Cytoscape instance
let currentElements = [];

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const detailsPanel = document.getElementById('details-panel');
const detailsPanelMobile = document.getElementById('details-panel-mobile');
const detailsContent = document.getElementById('details-content');
const detailsContentMobile = document.getElementById('details-content-mobile');
const emptyState = document.getElementById('empty-state');
const loader = document.getElementById('loader');
const tooltip = document.getElementById('tooltip');

// Initialize zoom controls for Cytoscape (called after Cytoscape is ready)
function setupZoomControls() {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetZoomBtn = document.getElementById('resetZoom');

    if (zoomInBtn) zoomInBtn.onclick = () => cy && cy.zoom(cy.zoom() * 1.2);
    if (zoomOutBtn) zoomOutBtn.onclick = () => cy && cy.zoom(cy.zoom() * 0.8);
    if (resetZoomBtn) resetZoomBtn.onclick = () => cy && cy.fit();
}

// Fetch transactions from Etherscan
async function fetchData(query) {
    console.log('fetchData called with query:', query);
    loader.classList.remove('hidden');

    try {
        let transactions = [];
        let apiUrl = '';

        if (query.length === 66) { // Transaction hash
            apiUrl = `${BASE_URL}?chainid=${CHAIN_ID}&module=proxy&action=eth_getTransactionByHash&txhash=${query}&apikey=${API_KEY}`;
            console.log('Fetching transaction by hash, URL:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('API response status:', response.status);

            const data = await response.json();
            console.log('API response data:', data);

            if (data.result) {
                transactions = [data.result];
                console.log('Single transaction found:', transactions.length);
            } else {
                console.log('No result in API response');
            }
        } else { // Address
            apiUrl = `${BASE_URL}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${query}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${API_KEY}`;
            console.log('Fetching transactions by address, URL:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('API response status:', response.status);

            const data = await response.json();
            console.log('API response data:', data);

            if (data.status === "1") {
                transactions = data.result;
                console.log('Transactions found:', transactions.length);
                console.log('First transaction sample:', transactions[0]);
            } else {
                console.log('API status not "1", status:', data.status, 'message:', data.message);
            }
        }

        console.log('Final transactions array length:', transactions.length);

        if (transactions.length > 0) {
            console.log('Calling renderGraph with', transactions.length, 'transactions');
            renderGraph(transactions, query);
            emptyState.classList.add('hidden');
            console.log('Graph rendering initiated');
        } else {
            console.log('No transactions found, showing alert');
            alert('No transactions found for this query.');
        }
    } catch (err) {
        console.error('Error in fetchData/renderGraph:', err);
        console.error('Error details:', err.message, err.stack);
        alert('Error loading transaction data. Please try again.');
    } finally {
        loader.classList.add('hidden');
        console.log('Loader hidden');
    }
}

// Render the Cytoscape.js graph
function renderGraph(transactions, centerQuery) {
    console.log('renderGraph called with', transactions.length, 'transactions, centerQuery:', centerQuery);

    // Initialize Cytoscape instance
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    console.log('Graph container dimensions:', width, 'x', height);

    // Process transactions into Cytoscape elements
    const elements = [];
    const nodesMap = new Map();

    // Process transactions (limit to 50 for performance)
    const relevantTx = transactions.slice(0, 50);
    console.log('Processing', relevantTx.length, 'relevant transactions');

    relevantTx.forEach((tx, index) => {
        // Add from address node
        if (!nodesMap.has(tx.from)) {
            nodesMap.set(tx.from, {
                id: tx.from,
                type: 'address',
                isMain: tx.from.toLowerCase() === centerQuery.toLowerCase()
            });
        }

        // Add to address node if exists
        if (tx.to && !nodesMap.has(tx.to)) {
            nodesMap.set(tx.to, {
                id: tx.to,
                type: 'address',
                isMain: tx.to.toLowerCase() === centerQuery.toLowerCase()
            });
        }

        // Add transaction node
        const txId = tx.hash;
        nodesMap.set(txId, {
            id: txId,
            type: 'transaction',
            data: tx,
            isMain: false
        });

        if (index < 3) { // Log first few for debugging
            console.log('Processed tx', index + 1, ':', {
                hash: tx.hash.slice(0, 10) + '...',
                from: tx.from.slice(0, 10) + '...',
                to: tx.to ? tx.to.slice(0, 10) + '...' : 'contract',
                isMain: tx.from.toLowerCase() === centerQuery.toLowerCase()
            });
        }
    });

    // Convert to Cytoscape node format and calculate positions
    const centerX = width / 2;
    const centerY = height / 2;
    const walletNodes = Array.from(nodesMap.values()).filter(n => n.type === 'address');
    const txNodes = Array.from(nodesMap.values()).filter(n => n.type === 'transaction');

    console.log(`${walletNodes.length} wallet nodes, ${txNodes.length} transaction nodes`);

    // Position main wallet in center
    const mainWallet = walletNodes.find(n => n.isMain);
    if (mainWallet) {
        mainWallet.x = centerX;
        mainWallet.y = centerY;
        console.log('Main wallet positioned at center');
    }

    // Position other wallets in a circle around the center
    const otherWallets = walletNodes.filter(n => !n.isMain);
    const walletRadius = Math.min(width, height) * 0.25;

    otherWallets.forEach((wallet, i) => {
        const angle = (i / otherWallets.length) * 2 * Math.PI;
        wallet.x = centerX + walletRadius * Math.cos(angle);
        wallet.y = centerY + walletRadius * Math.sin(angle);
    });

    // Position transaction nodes between their connected wallets
    txNodes.forEach(tx => {
        const fromWallet = walletNodes.find(w => w.id === tx.data.from);
        const toWallet = walletNodes.find(w => w.id === tx.data.to);

        if (fromWallet && toWallet) {
            tx.x = (fromWallet.x + toWallet.x) / 2;
            tx.y = (fromWallet.y + toWallet.y) / 2;
        } else if (fromWallet) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = 100;
            tx.x = fromWallet.x + distance * Math.cos(angle);
            tx.y = fromWallet.y + distance * Math.sin(angle);
        }
    });

    // Create Cytoscape nodes
    Array.from(nodesMap.values()).forEach(node => {
        elements.push({
            data: {
                id: node.id,
                label: node.type === 'transaction' ?
                    node.id.slice(0, 8) + '...' :
                    node.id.slice(0, 8) + '...',
                type: node.type,
                isMain: node.isMain,
                originalData: node.data
            },
            position: { x: node.x, y: node.y }
        });
    });

    // Create Cytoscape edges
    relevantTx.forEach(tx => {
        elements.push({
            data: {
                id: `edge_from_${tx.hash}`,
                source: tx.hash,
                target: tx.from
            }
        });
        if (tx.to) {
            elements.push({
                data: {
                    id: `edge_to_${tx.hash}`,
                    source: tx.hash,
                    target: tx.to
                }
            });
        }
    });

    console.log('Created', elements.filter(e => e.data.source).length, 'edges and',
                elements.filter(e => !e.data.source).length, 'nodes');

    // Initialize Cytoscape
    cy = cytoscape({
        container: container,
        elements: elements,
        style: [
            {
                selector: 'node[type="address"]',
                style: {
                    'background-color': '#3b82f6',
                    'border-color': '#1e40af',
                    'border-width': '3px',
                    'width': '100px',
                    'height': '40px',
                    'label': 'data(label)',
                    'font-family': 'JetBrains Mono, monospace',
                    'font-size': '11px',
                    'color': '#ffffff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-wrap': 'wrap',
                    'text-max-width': '90px'
                }
            },
            {
                selector: 'node[type="transaction"]',
                style: {
                    'background-color': '#10b981',
                    'border-color': '#059669',
                    'border-width': '3px',
                    'width': '80px',
                    'height': '32px',
                    'label': 'data(label)',
                    'font-family': 'JetBrains Mono, monospace',
                    'font-size': '10px',
                    'color': '#ffffff',
                    'text-valign': 'center',
                    'text-halign': 'center'
                }
            },
            {
                selector: 'node[isMain]',
                style: {
                    'background-color': '#8b5cf6',
                    'border-color': '#7c3aed',
                    'border-width': '4px'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': '2px',
                    'line-color': '#d1d5db',
                    'target-arrow-color': '#9ca3af',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-color': '#f59e0b',
                    'border-width': '4px'
                }
            }
        ],
        layout: {
            name: 'preset' // Preserves x/y positions we set
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false
    });

    // Make nodes draggable individually
    cy.nodes().grabify();

    // Node management - delete on double-click
    cy.on('dbltap', 'node', function(evt) {
        const node = evt.target;
        if (confirm(`Delete node ${node.data('label')}?`)) {
            cy.remove(node);
        }
    });

    // Show details on click for both transaction and address nodes
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        const nodeData = node.data();

        if (nodeData.type === 'transaction' && nodeData.originalData) {
            // Show transaction details
            showDetails(nodeData.originalData);
        } else if (nodeData.type === 'address') {
            // For address nodes, show a summary or related info
            showAddressDetails(nodeData);
        }
    });

    // Tooltip on hover
    cy.on('mouseover', 'node', function(evt) {
        const node = evt.target;
        const nodeData = node.data();

        if (nodeData.type === 'transaction' && nodeData.originalData) {
            const tx = nodeData.originalData;
            const value = (parseInt(tx.value) / 1e18).toFixed(6);

            showTooltip(evt.originalEvent, {
                type: 'transaction',
                data: tx,
                id: tx.hash
            });
        } else {
            showTooltip(evt.originalEvent, {
                type: 'address',
                id: nodeData.id,
                isMain: nodeData.isMain
            });
        }
    });

    cy.on('mouseout', 'node', function() {
        hideTooltip();
    });

    // Fit graph to viewport
    cy.fit();

    // Setup zoom controls
    setupZoomControls();

    // Store elements for reset functionality
    currentElements = elements;

    console.log('Cytoscape graph initialized successfully');
}

// Reset graph function
function resetGraph() {
    if (cy) {
        cy.elements().remove();
        if (currentElements && currentElements.length > 0) {
            cy.add(currentElements);
            cy.fit();
        }
    }
}

// Render mobile version
function renderMobileGraph(nodes, links) {
    initD3('graph-container-mobile');
    const width = document.getElementById('graph-container-mobile').clientWidth;
    const height = document.getElementById('graph-container-mobile').clientHeight;

    // Simplified layout for mobile
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;

    nodes.forEach((node, i) => {
        if (node.isMain) {
            node.x = centerX;
            node.y = centerY;
        } else {
            const angle = (i / nodes.length) * 2 * Math.PI;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        }
    });

    const link = g.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)")
        .attr("d", d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);

    const node = g.append("g")
        .selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", "node");

    node.append("rect")
        .attr("width", d => d.type === 'transaction' ? 60 : 80)
        .attr("height", 28)
        .attr("x", d => d.type === 'transaction' ? -30 : -40)
        .attr("y", -14)
        .attr("rx", 4)
        .attr("class", d => `node-shape ${d.type} ${d.isMain ? 'main' : ''}`)
        .on("click", (event, d) => showDetails(d));

    node.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .attr("class", "node-label")
        .text(d => d.id.slice(0, 4) + '...');

    node.attr("transform", d => `translate(${d.x},${d.y})`);
}

// Pinboard drag behavior - only dragged node moves
function drag(simulation) {
    function dragstarted(event) {
        // Bring node to front visually
        if (event.subject.element) {
            event.subject.element.raise();
        }
        // Don't restart simulation - keep it static
    }

    function dragged(event) {
        // Only move the dragged node
        event.subject.x = event.x;
        event.subject.y = event.y;
        event.subject.fx = event.x; // Pin it in place
        event.subject.fy = event.y;

        // Update the visual position immediately
        if (event.subject.element) {
            event.subject.element.attr("transform", `translate(${event.x},${event.y})`);
        }
    }

    function dragended(event) {
        // Keep node pinned where user dropped it
        event.subject.fx = event.x;
        event.subject.fy = event.y;
        event.subject.x = event.x;
        event.subject.y = event.y;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

// Tooltip functions
function showTooltip(event, d) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.opacity = '1';

    let content = '';
    if (d.type === 'transaction') {
        const value = (parseInt(d.data.value) / 1e18).toFixed(6);
        content = `
            <div><strong>Hash:</strong> ${d.id.slice(0, 10)}...</div>
            <div><strong>Value:</strong> ${value} ETH</div>
            <div><strong>Time:</strong> ${new Date(parseInt(d.data.timeStamp) * 1000).toLocaleString()}</div>
        `;
    } else {
        content = `
            <div><strong>Address:</strong> ${d.id.slice(0, 10)}...</div>
            <div><strong>Type:</strong> ${d.isMain ? 'Center' : 'Connected'}</div>
        `;
    }

    tooltip.innerHTML = content;

    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.opacity = '0';
}

// Show address details
function showAddressDetails(nodeData) {
    const address = nodeData.id;

    // Get connected transactions for this address
    const connectedTransactions = currentElements
        .filter(el => el.data.source && (el.data.source === address || el.data.target === address))
        .map(el => el.data.source === address ? el.data.target : el.data.source)
        .filter(id => id !== address); // Remove self-references

    const transactionCount = connectedTransactions.length;
    const uniqueAddresses = new Set(connectedTransactions).size;

    const detailsHtml = `
        <div class="space-y-6">
            <!-- Address -->
            <div class="space-y-2">
                <div class="text-sm text-gray-600 font-medium">Wallet Address</div>
                <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <code class="flex-1 text-xs font-mono text-gray-900 break-all">${address}</code>
                    <button onclick="copyToClipboard('${address}')" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                    <a href="https://etherscan.io/address/${address}" target="_blank" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Address Type -->
            <div class="space-y-1">
                <div class="text-sm text-gray-600 font-medium">Address Type</div>
                <div class="text-lg font-semibold ${nodeData.isMain ? 'text-purple-600' : 'text-blue-600'}">
                    ${nodeData.isMain ? '🎯 Searched Address (Center)' : '🔗 Connected Address'}
                </div>
            </div>

            <!-- Transaction Summary -->
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                    <div class="text-sm text-gray-600 font-medium">Transactions</div>
                    <div class="text-2xl font-bold font-mono text-green-600">${transactionCount}</div>
                </div>
                <div class="space-y-1">
                    <div class="text-sm text-gray-600 font-medium">Connected Wallets</div>
                    <div class="text-2xl font-bold font-mono text-blue-600">${uniqueAddresses}</div>
                </div>
            </div>

            <!-- Description -->
            <div class="space-y-2">
                <div class="text-sm text-gray-600 font-medium">Description</div>
                <div class="text-sm text-gray-700 leading-relaxed">
                    ${nodeData.isMain
                        ? 'This is the wallet address you searched for. It appears as the central node in the transaction network.'
                        : `This wallet has interacted with the searched address through ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}.`
                    }
                </div>
            </div>
        </div>
    `;

    // Show desktop panel
    detailsContent.innerHTML = detailsHtml;
    detailsPanel.classList.remove('hidden');

    // Show mobile panel
    detailsContentMobile.innerHTML = detailsHtml;
    detailsPanelMobile.classList.remove('hidden');
}

// Show transaction details
function showDetails(d) {
    if (d.type === 'transaction') {
        const tx = d.data;
        const value = (parseInt(tx.value) / 1e18).toFixed(6);
        const timestamp = new Date(parseInt(tx.timeStamp) * 1000);

        const detailsHtml = `
            <div class="space-y-6">
                <!-- Transaction Hash -->
                <div class="space-y-2">
                    <div class="text-sm text-gray-600 font-medium">Transaction Hash</div>
                    <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <code class="flex-1 text-xs font-mono text-gray-900 break-all">${tx.hash}</code>
                        <button onclick="copyToClipboard('${tx.hash}')" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <a href="https://etherscan.io/tx/${tx.hash}" target="_blank" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Block & Confirmations -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <div class="text-sm text-gray-600 font-medium">Block</div>
                        <div class="text-lg font-semibold font-mono">${parseInt(tx.blockNumber).toLocaleString()}</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-sm text-gray-600 font-medium">Confirmations</div>
                        <div class="text-lg font-semibold font-mono">${parseInt(tx.confirmations).toLocaleString()}</div>
                    </div>
                </div>

                <!-- Timestamp -->
                <div class="space-y-1">
                    <div class="text-sm text-gray-600 font-medium">Timestamp</div>
                    <div class="space-y-1">
                        <div class="text-sm font-medium">${timestamp.toLocaleString()}</div>
                        <div class="text-xs text-gray-500">${timestamp.toLocaleDateString()}</div>
                    </div>
                </div>

                <!-- Value & Gas -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <div class="text-sm text-gray-600 font-medium">Value</div>
                        <div class="text-xl font-bold font-mono text-green-600">${value} ETH</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-sm text-gray-600 font-medium">Gas Fee</div>
                        <div class="text-lg font-semibold font-mono">${((parseInt(tx.gasUsed) * parseInt(tx.gasPrice)) / 1e18).toFixed(8)} ETH</div>
                    </div>
                </div>

                <!-- From Address -->
                <div class="space-y-2">
                    <div class="text-sm text-gray-600 font-medium">From</div>
                    <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <code class="flex-1 text-xs font-mono text-gray-900 break-all">${tx.from}</code>
                        <button onclick="copyToClipboard('${tx.from}')" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <a href="https://etherscan.io/address/${tx.from}" target="_blank" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- To Address -->
                <div class="space-y-2">
                    <div class="text-sm text-gray-600 font-medium">To</div>
                    <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <code class="flex-1 text-xs font-mono text-gray-900 break-all">${tx.to || 'Contract Creation'}</code>
                        ${tx.to ? `
                            <button onclick="copyToClipboard('${tx.to}')" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            <a href="https://etherscan.io/address/${tx.to}" target="_blank" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </a>
                        ` : ''}
                    </div>
                </div>

                <!-- Method (if available) -->
                ${tx.functionName ? `
                    <div class="space-y-2">
                        <div class="text-sm text-gray-600 font-medium">Method</div>
                        <code class="block p-3 bg-gray-50 rounded-lg border text-xs font-mono text-gray-900">${tx.functionName}</code>
                    </div>
                ` : ''}
            </div>
        `;

        // Show desktop panel
        detailsContent.innerHTML = detailsHtml;
        detailsPanel.classList.remove('hidden');

        // Show mobile panel
        detailsContentMobile.innerHTML = detailsHtml;
        detailsPanelMobile.classList.remove('hidden');
    }
}

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
        notification.textContent = 'Copied to clipboard!';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');

    // Get DOM elements (do this inside DOMContentLoaded)
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const detailsPanel = document.getElementById('details-panel');
    const detailsPanelMobile = document.getElementById('details-panel-mobile');
    const detailsContent = document.getElementById('details-content');
    const detailsContentMobile = document.getElementById('details-content-mobile');
    const emptyState = document.getElementById('empty-state');
    const loader = document.getElementById('loader');
    const tooltip = document.getElementById('tooltip');

    console.log('DOM elements found:', {
        searchInput: !!searchInput,
        searchBtn: !!searchBtn,
        detailsPanel: !!detailsPanel
    });

    // Event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            console.log('Search button clicked');
            const val = searchInput.value.trim();
            console.log('Search value:', val);
            if (val) {
                console.log('Calling fetchData with:', val);
                fetchData(val);
            } else {
                console.log('No search value entered');
            }
        });
        console.log('Search button event listener added');
    } else {
        console.error('Search button not found!');
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed, triggering search');
                searchBtn.click();
            }
        });
        console.log('Search input event listener added');
    } else {
        console.error('Search input not found!');
    }

    // Mobile panel close
    const closePanelBtn = document.getElementById('closePanelMobile');
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            detailsPanelMobile.classList.add('hidden');
        });
        console.log('Close panel button event listener added');
    }

    // Theme toggle (placeholder)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            console.log('Theme toggle clicked');
        });
        console.log('Theme toggle event listener added');
    }

    console.log('All event listeners initialized successfully');
});

// Window resize (this can stay outside since window is always available)
window.addEventListener('resize', () => {
    if (svg && currentNodes.length > 0) {
        const width = document.getElementById('graph-container').clientWidth;
        const height = document.getElementById('graph-container').clientHeight;
        svg.attr("viewBox", [0, 0, width, height]);
    }
});
