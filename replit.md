# ETH Flow Tracker

## Overview

ETH Flow Tracker is an Ethereum transaction flow visualization tool that allows users to explore transaction histories and relationships by entering an Ethereum address or transaction hash. The application fetches real-time data from the Etherscan API and presents it through an interactive node-based visualization alongside detailed transaction information panels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing with a simple single-page application structure.

**State Management**: 
- TanStack Query (React Query) for server state management and API data caching
- React hooks for local component state
- Context API for theme management

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows Material Design principles with blockchain explorer aesthetics (inspired by Etherscan and Blockchair).

**Styling System**:
- Tailwind CSS with custom configuration supporting theme variables
- CSS custom properties for theme switching (light/dark mode)
- Typography: Inter for UI text, JetBrains Mono for monospaced data (addresses, hashes)
- Color system based on HSL values with semantic naming

**Visualization**: ReactFlow library for rendering the transaction flow graph with custom node styling and interactive features.

### Backend Architecture

**Runtime**: Node.js with Express.js server handling API proxying.

**API Proxy Pattern**: The backend serves as a secure proxy to the Etherscan API, keeping the API key server-side and preventing direct client exposure. All Etherscan requests flow through `/api/etherscan` endpoint with the API key injected server-side.

**Development vs Production**:
- Development: Vite dev server with HMR (Hot Module Replacement) running in middleware mode
- Production: Static file serving of pre-built Vite bundle
- Replit-specific plugins for enhanced development experience

**No Database**: The application is stateless and doesn't persist any data locally. All transaction data comes directly from the Etherscan API on-demand.

### External Dependencies

**Etherscan API**: Primary data source for all Ethereum transaction information. The API provides:
- Transaction lists for addresses
- Transaction details by hash
- Block information
- Account balances

Rate limiting is handled with proper error responses (429 status codes).

**Third-Party Services**:
- Etherscan API (requires API key via `ETHERSCAN_API_KEY` environment variable)
- Google Fonts CDN for Inter and JetBrains Mono typefaces

**Key Libraries**:
- `ethers.js`: Ethereum utilities for address validation and value formatting
- `axios`: HTTP client for API requests with error handling
- `react-flow`: Interactive graph visualization
- `date-fns`: Date formatting utilities
- `zod`: Runtime schema validation for API responses

**UI Component Dependencies**:
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling
- lucide-react for icon system

### Database

**Current State**: No database implementation. The application is designed as a read-only blockchain explorer that sources all data from external APIs.

**Storage Interface**: A minimal storage interface exists in `server/storage.ts` as a placeholder for potential future enhancements (such as caching frequently accessed addresses or storing user preferences).

### Configuration

**Environment Variables**:
- `ETHERSCAN_API_KEY`: Required for Etherscan API access
- `DATABASE_URL`: Defined in Drizzle config but not currently used
- `NODE_ENV`: Controls development vs production behavior

**Build Configuration**:
- TypeScript with strict mode enabled
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)
- ESM module system throughout