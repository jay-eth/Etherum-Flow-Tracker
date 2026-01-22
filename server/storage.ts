// This app doesn't require persistent storage since all data comes from Etherscan API
// Storage interface kept for potential future use

export interface IStorage {
  // Add storage methods here if needed
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage if needed
  }
}

export const storage = new MemStorage();
