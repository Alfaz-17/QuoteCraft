import fs from "fs";
import path from "path";

// Define the data folder path inside the workspace
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const QUOTATIONS_FILE = path.join(DATA_DIR, "quotations.json");

// Helper function to guarantee that files and directories exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(QUOTATIONS_FILE)) {
    fs.writeFileSync(QUOTATIONS_FILE, JSON.stringify([]));
  }
}

// Read and write helper for Users
function getUsers(): any[] {
  initDB();
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    return [];
  }
}

function saveUsers(users: any[]) {
  initDB();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Read and write helper for Quotations
function getQuotations(): any[] {
  initDB();
  try {
    const data = fs.readFileSync(QUOTATIONS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    return [];
  }
}

function saveQuotations(quotations: any[]) {
  initDB();
  fs.writeFileSync(QUOTATIONS_FILE, JSON.stringify(quotations, null, 2));
}

// Generate unique ID
function generateUUID(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Export a fully type-compatible mock object mapping to local JSON storage
export const prisma: any = {
  user: {
    findUnique: async (args: { where: { email?: string; id?: string }; select?: { geminiApiKey?: boolean } }) => {
      const users = getUsers();
      if (users.length === 0) return null;

      const user = users.find((u: any) => {
        if (args.where.email) {
          return u.email.toLowerCase() === args.where.email.toLowerCase();
        }
        if (args.where.id) {
          return u.id === args.where.id;
        }
        return false;
      });

      const targetUser = user || (Object.keys(args.where).length === 0 || !args.where.email && !args.where.id ? users[0] : null);
      if (!targetUser) return null;

      // Handle the Prisma "select" filter if requested
      if (args.select) {
        const result: any = {};
        if (args.select.geminiApiKey) {
          result.geminiApiKey = targetUser.geminiApiKey;
        }
        return result;
      }

      return targetUser;
    },
    create: async (args: { data: { name?: string; email: string; password?: string } }) => {
      const users = getUsers();
      const newUser = {
        id: generateUUID(),
        name: args.data.name || null,
        email: args.data.email.toLowerCase(),
        password: args.data.password || "",
        geminiApiKey: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveUsers(users);
      return newUser;
    },
    update: async (args: { where: { id: string }; data: { geminiApiKey?: string | null } }) => {
      const users = getUsers();
      const index = users.findIndex((u: any) => u.id === args.where.id);
      if (index === -1) {
        throw new Error(`User not found: ${args.where.id}`);
      }

      const user = users[index];
      if (args.data.geminiApiKey !== undefined) {
        user.geminiApiKey = args.data.geminiApiKey;
      }
      user.updatedAt = new Date().toISOString();
      users[index] = user;
      saveUsers(users);
      return user;
    }
  },

  quotation: {
    findFirst: async (args: { where: { userId: string; number: string } }) => {
      const quotations = getQuotations();
      const quote = quotations.find(
        (q: any) => q.userId === args.where.userId && q.number === args.where.number
      );
      return quote || null;
    },
    create: async (args: { data: any }) => {
      const quotations = getQuotations();
      const newQuote = {
        id: generateUUID(),
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      quotations.push(newQuote);
      saveQuotations(quotations);
      return newQuote;
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const quotations = getQuotations();
      const index = quotations.findIndex((q: any) => q.id === args.where.id);
      if (index === -1) {
        throw new Error(`Quotation not found: ${args.where.id}`);
      }

      const quote = {
        ...quotations[index],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      quotations[index] = quote;
      saveQuotations(quotations);
      return quote;
    }
  }
};
