import { IStorage, MemStorage } from "./storage";
import { DatabaseStorage } from "./database-storage";

let storageInstance: IStorage;

if (process.env.DATABASE_URL) {
  console.log("[storage] Using DatabaseStorage with PostgreSQL");
  storageInstance = new DatabaseStorage();
} else {
  console.log("[storage] Using MemStorage (in-memory storage)");
  storageInstance = new MemStorage();
}

export const storage = storageInstance;