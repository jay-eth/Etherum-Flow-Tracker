# ETH Flow Tracker - Project Documentation

## Overview

ETH Flow Tracker is an Ethereum blockchain explorer and transaction visualization tool that allows users to explore transaction histories and relationships by entering an Ethereum address or transaction hash. The application fetches real-time data from the Etherscan API and presents it through an interactive node-based visualization alongside detailed transaction information panels.

**Live Demo:** Enter any Ethereum address or transaction hash to visualize the transaction flow and explore blockchain data.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [How It Works](#how-it-works)
5. [How It Was Built](#how-it-was-built)
6. [Installation & Setup](#installation--setup)
7. [Usage Guide](#usage-guide)
8. [API Integration](#api-integration)
9. [Future Enhancements](#future-enhancements)
10. [Verification & Trust](#verification--trust)

---

## Features

### Current Features (MVP)

1. **Transaction Lookup**
   - Search by Ethereum address (0x...)
   - Search by transaction hash (0x... 64 characters)
   - Real-time data fetching from Etherscan API

2. **Interactive Flow Visualization**
   - Node-based graph showing transaction relationships
   - Visual representation of ETH flow between addresses
   - Clickable nodes to view transaction details
   - Zoom, pan, and navigate the transaction graph

3. **Detailed Transaction Information**
   - Transaction hash with copy-to-clipboard
   - Block number and confirmations
   - Timestamp (relative and absolute)
   - From/To addresses with formatting
   - ETH value transferred
   - Gas used and gas fees
   - Transaction status (success/failed)
   - Smart contract method calls

4. **Etherscan Verification Links**
   - Direct links to verify transactions on Etherscan.io
   - Links for transaction hashes
   - Links for wallet addresses
   - Ensures data transparency and trustworthiness

5. **Theme Support**
   - Light and dark mode toggle
   - Persistent theme preferences
   - Professional blockchain explorer aesthetic

6. **Responsive Design**
   - Works on desktop and mobile devices
   - Adaptive layout for different screen sizes
   - Touch-friendly controls

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and dev server
- **Wouter** - Lightweight client-side routing
- **TanStack Query (React Query)** - Server state management and caching
- **ReactFlow** - Interactive node-based graph visualization
- **ethers.js** - Ethereum utilities and formatting
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library built on Radix UI
- **Lucide React** - Icon system
- **date-fns** - Date formatting

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **Axios** - HTTP client for API requests
- **TypeScript** - Type-safe backend code

### External Services
- **Etherscan API V2** - Ethereum blockchain data provider
- **Google Fonts** - Inter and JetBrains Mono typefaces

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Search Bar │  │ Flow Diagram │  │ Details Panel    │    │
│  │            │  │  (ReactFlow) │  │                  │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
│                          ↓                                   │
│                  ┌───────────────┐                          │
│                  │ React Query   │                          │
│                  │ (Caching)     │                          │
│                  └───────────────┘                          │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────┴───────────────────────────────────┐
│                    EXPRESS BACKEND                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/etherscan (Proxy Endpoint)                     │  │
│  │  - Injects API key server-side                       │  │
│  │  - Adds chainid=1 for Ethereum mainnet              │  │
│  │  - Handles errors and rate limiting                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
                ┌──────────────────────┐
                │  Etherscan API V2    │
                │  (External Service)  │
                └──────────────────────┘
```

### Data Flow

1. **User Input** → User enters Ethereum address or transaction hash
2. **Validation** → Frontend validates format (address vs. hash)
3. **API Request** → Frontend calls `/api/etherscan` with parameters
4. **Backend Proxy** → Express server adds API key and forwards to Etherscan
5. **Data Retrieval** → Etherscan returns transaction list or details
6. **Caching** → React Query caches response for performance
7. **Visualization** → ReactFlow renders transaction graph
8. **Display** → Transaction details shown in side panel

---

## How It Works

### 1. Search & Query

When a user enters an address or hash:

```typescript
// Address format: 0x + 40 hex characters
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

// Transaction hash: 0x + 64 hex characters  
const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
```

The app determines the query type and makes the appropriate API call.

### 2. API Proxy Pattern

The backend serves as a secure proxy to keep the Etherscan API key private:

```typescript
// server/routes.ts
app.get("/api/etherscan", async (req, res) => {
  const response = await axios.get("https://api.etherscan.io/v2/api", {
    params: {
      chainid: 1,        // Ethereum mainnet
      ...req.query,      // User parameters
      apikey: API_KEY,   // Injected server-side
    },
  });
  res.json(response.data);
});
```

### 3. Transaction Fetching

**For Addresses:**
- Fetches up to 50 recent transactions
- Sorted by newest first
- Includes normal ETH transfers and smart contract interactions

**For Transaction Hashes:**
- Fetches the specific transaction
- Also fetches related transactions from sender/receiver
- Shows context around that transaction

### 4. Data Visualization

ReactFlow creates an interactive graph:

```
[Address A] ──(0.0118 ETH)──> [Address B]
     │
     └──(0.005 ETH)──> [Address C]
```

- **Nodes** = Ethereum addresses
- **Edges** = Transactions (arrows showing ETH flow)
- **Labels** = Amount transferred

### 5. Real-Time Verification

Every transaction and address has an Etherscan link:
- Click the blue external link icon
- Opens Etherscan.io in a new tab
- Verify all data matches exactly

---

## How It Was Built

### Phase 1: Foundation Setup

1. **Project Initialization**
   - Set up Vite + React + TypeScript
   - Configured Express backend
   - Integrated Tailwind CSS and shadcn/ui

2. **Type System**
   - Created shared schemas (`shared/schema.ts`)
   - Defined Ethereum transaction types
   - Zod validation schemas

### Phase 2: Backend Development

1. **API Proxy Implementation**
   - Created Express route for `/api/etherscan`
   - Implemented secure API key injection
   - Added error handling and rate limit responses

2. **Etherscan V2 Migration**
   - Updated from deprecated V1 endpoint
   - Added `chainid` parameter
   - Changed base URL to `/v2/api`

### Phase 3: Frontend Components

1. **Search Component**
   - Input validation for addresses/hashes
   - Loading states
   - Error messaging

2. **Visualization System**
   - Integrated ReactFlow library
   - Custom node styling
   - Edge labels for transaction amounts
   - Interactive controls (zoom, pan)

3. **Details Panel**
   - Transaction information display
   - Copy-to-clipboard functionality
   - Etherscan verification links
   - Status badges (success/failed)

### Phase 4: Data Integration

1. **React Query Setup**
   - Query caching configuration
   - Loading and error states
   - Automatic refetching

2. **Etherscan Client**
   - `getAddressTransactions()` - Fetch address history
   - `getTransactionByHash()` - Fetch single transaction
   - `fetchTransactionData()` - Smart routing based on input

### Phase 5: Polish & UX

1. **Theme System**
   - Light/dark mode toggle
   - Theme persistence in localStorage
   - Color scheme optimization

2. **Error Handling**
   - Network error states
   - Empty states
   - API rate limit handling

3. **Responsive Design**
   - Mobile-friendly layout
   - Touch controls
   - Adaptive grid system

---

## Installation & Setup

### Prerequisites

- Node.js 20+ installed
- Etherscan API key (free from https://etherscan.io/myapikey)

### Setup Steps

1. **Clone/Open Project**
   ```bash
   # Project is ready on Replit
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   - Add `ETHERSCAN_API_KEY` to Replit Secrets
   - Or create `.env` file:
   ```
   ETHERSCAN_API_KEY=your_api_key_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Open browser to `http://localhost:5000`
   - Or use Replit's webview

### Build for Production

```bash
npm run build
npm start
```

---

## Usage Guide

### Searching for Transactions

1. **By Ethereum Address**
   - Copy any Ethereum wallet address
   - Paste into search bar
   - Example: `0xD87Cc20459B17d1d5D7Ad752463987732c507C43`
   - View all transactions for that address

2. **By Transaction Hash**
   - Copy a transaction hash from Etherscan
   - Paste into search bar
   - Example: `0x9b22ca54e9f1def94a31c1254feb1284a1aa69633368e98010ad7609f2e28dae`
   - View that specific transaction plus related ones

### Navigating the Visualization

- **Zoom:** Scroll wheel or pinch on mobile
- **Pan:** Click and drag the canvas
- **Select Transaction:** Click on an arrow between nodes
- **View Details:** Details appear in right panel when transaction selected

### Verifying Data

1. Click on a transaction arrow to view details
2. Look for blue external link icons (🔗)
3. Click any icon to open Etherscan
4. Compare values - they will match exactly

### Understanding the Display

- **Green badges** = Successful transactions
- **Red badges** = Failed transactions
- **Large numbers** = Block confirmations (higher = more secure)
- **Time ago** = When transaction occurred
- **Gas fee** = Cost to process transaction

---

## API Integration

### Etherscan API V2

**Base URL:** `https://api.etherscan.io/v2/api`

**Required Parameters:**
- `chainid` - Chain ID (1 for Ethereum mainnet)
- `apikey` - Your Etherscan API key
- `module` - API module (e.g., "account", "transaction")
- `action` - Specific action (e.g., "txlist", "balance")

### Common Endpoints Used

1. **Get Address Transactions**
   ```
   GET /v2/api?chainid=1&module=account&action=txlist
   &address=0x...&startblock=0&endblock=99999999
   &page=1&offset=50&sort=desc&apikey=XXX
   ```

2. **Get Transaction by Hash**
   ```
   GET /v2/api?chainid=1&module=proxy
   &action=eth_getTransactionByHash&txhash=0x...&apikey=XXX
   ```

3. **Get Transaction Receipt**
   ```
   GET /v2/api?chainid=1&module=proxy
   &action=eth_getTransactionReceipt&txhash=0x...&apikey=XXX
   ```

### Rate Limits

- **Free Tier:** 5 calls/second, max 100,000 calls/day
- **Paid Tiers:** Higher limits available

---

## Future Enhancements

### Potential Features to Add

#### 1. Advanced Transaction Analysis
- **Token transfers** (ERC-20, ERC-721, ERC-1155)
- **Internal transactions** (smart contract calls)
- **Transaction value in USD** (real-time price conversion)
- **Gas price analytics** (show if fee was high/low)

#### 2. Multi-Chain Support
- Support for other chains (Polygon, Arbitrum, Optimism, Base)
- Chain selector dropdown
- Multi-chain balance view

#### 3. Enhanced Visualization
- **Different graph layouts** (hierarchical, circular, force-directed)
- **Time-based filtering** (last 24h, 7 days, 30 days, all time)
- **Value filters** (show only transactions > X ETH)
- **Address labels** (show known addresses like exchanges)
- **Color coding** by transaction type or value

#### 4. Wallet Features
- **Watch addresses** (save favorite addresses)
- **Notifications** (alert on new transactions)
- **Portfolio tracking** (calculate total value)
- **Export data** (CSV, JSON)

#### 5. Analytics Dashboard
- **Transaction statistics** (total count, volume, average value)
- **Gas spent over time** (charts and graphs)
- **Most frequent counterparties**
- **Transaction frequency heatmap**

#### 6. Smart Contract Interaction
- **Decode contract calls** (show human-readable function calls)
- **Contract source code view**
- **ABI integration** (understand contract methods)
- **Event log decoding**

#### 7. Advanced Search
- **Multiple address search** (compare 2+ addresses)
- **Date range filtering**
- **Advanced query builder**
- **Saved searches**

#### 8. Social Features
- **Share visualizations** (generate shareable links)
- **Public/private notes** on addresses
- **Tag addresses** (exchange, DeFi protocol, personal, etc.)

#### 9. Performance Optimization
- **Database caching** (PostgreSQL for frequent queries)
- **Pagination** for large result sets
- **Lazy loading** of transaction details
- **WebSocket updates** for real-time data

#### 10. User Experience
- **Onboarding tutorial** (first-time user guide)
- **Example addresses** (pre-filled popular addresses)
- **Keyboard shortcuts**
- **Mobile app** (React Native version)

#### 11. Security & Privacy
- **Anonymous mode** (no tracking)
- **API key encryption** (additional security layer)
- **Request rate limiting** (prevent abuse)

#### 12. Developer Tools
- **API endpoint** (allow others to use your backend)
- **Embed widget** (embeddable transaction viewer)
- **GraphQL API** (flexible querying)

---

## Verification & Trust

### How to Know the Data is Real

The ETH Flow Tracker shows **100% authentic blockchain data** pulled directly from Etherscan's API. Here's how to verify:

1. **Direct Etherscan Links**
   - Every transaction has a verification link
   - Click the blue external link icon (🔗)
   - Opens official Etherscan.io page
   - Compare the data - it will match exactly

2. **Open Source Code**
   - All code is visible in this project
   - No data manipulation or fake values
   - API calls are straightforward proxy requests

3. **API Response Structure**
   - Backend simply forwards Etherscan responses
   - No modification of transaction data
   - What Etherscan sends is what you see

### Trust Model

```
Etherscan (Source of Truth)
    ↓
Backend (Secure Proxy)
    ↓
Frontend (Display Only)
    ↓
Your Browser
```

The app **never generates or modifies** blockchain data - it only displays what Etherscan provides.

---

## Technical Details

### File Structure

```
eth-flow-tracker/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── TransactionFlowVisualization.tsx
│   │   │   ├── TransactionDetailsPanel.tsx
│   │   │   └── ...
│   │   ├── lib/             # Utilities and clients
│   │   │   ├── etherscan.ts # Etherscan API client
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/           # Page components
│   │   │   └── Home.tsx
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   └── index.html
├── server/                   # Backend application
│   ├── index.ts             # Express server
│   ├── routes.ts            # API routes
│   └── vite.ts              # Vite integration
├── shared/                   # Shared types
│   └── schema.ts            # Transaction schemas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md                # This file
```

### Key Technologies Explained

**React Query (TanStack Query)**
- Handles API calls, caching, and state
- Prevents duplicate requests
- Automatic background refetching
- Loading and error states

**ReactFlow**
- Creates interactive node graphs
- Handles zoom, pan, selection
- Custom node and edge rendering
- Performance optimized for large graphs

**ethers.js**
- Format Wei to ETH (1 ETH = 10^18 Wei)
- Validate addresses
- Parse transaction data
- Handle BigInt values

**Tailwind CSS + shadcn/ui**
- Utility-first styling
- Consistent design system
- Dark mode support
- Accessible components

---

## Contributing

To add new features:

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Update this documentation
5. Submit for review

---

## Support & Resources

- **Etherscan API Docs:** https://docs.etherscan.io/
- **ReactFlow Docs:** https://reactflow.dev/
- **Ethereum Docs:** https://ethereum.org/en/developers/docs/

---

## License

This project is open source and available for educational purposes.

---

## Changelog

### v1.0.0 (Current)
- Initial MVP release
- Etherscan API V2 integration
- Interactive transaction visualization
- Transaction details panel
- Verification links
- Theme support
- Responsive design

---

**Built with ❤️ for the Ethereum community**
