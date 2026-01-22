import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

const ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api";
const API_KEY = process.env.ETHERSCAN_API_KEY || "";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy endpoint for Etherscan API to keep API key secure
  app.get("/api/etherscan", async (req, res) => {
    try {
      const response = await axios.get(ETHERSCAN_API_URL, {
        params: {
          chainid: 1, // Ethereum mainnet
          ...req.query,
          apikey: API_KEY,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error("Etherscan API error:", error);
      
      // Handle Axios errors with proper status codes
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "Failed to fetch data from Etherscan";
        
        // Handle rate limiting
        if (status === 429) {
          res.status(429).json({
            status: "0",
            message: "Rate limit exceeded. Please try again later.",
            result: [],
          });
          return;
        }
        
        // Pass through other HTTP errors
        res.status(status).json({
          status: "0",
          message,
          result: [],
        });
        return;
      }

      // Generic error fallback
      res.status(500).json({
        status: "0",
        message: "An unexpected error occurred",
        result: [],
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
