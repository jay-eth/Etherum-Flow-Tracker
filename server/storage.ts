import { EthereumTransaction } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // Add storage methods here if needed
}

export class FileStorage implements IStorage {
  private dataPath: string;

  constructor() {
    this.dataPath = path.resolve(process.cwd(), "data", "storage.json");
    this.init();
  }

  private async init() {
    try {
      await fs.access(this.dataPath);
    } catch {
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      await fs.writeFile(this.dataPath, JSON.stringify({}));
    }
  }
}

export const storage = new FileStorage();
