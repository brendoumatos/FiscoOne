import fs from 'fs';
import path from 'path';

// Interface for scalability (allows easy swap to Azure Blob Storage)
interface IStorageProvider {
    saveFile(filePath: string, content: string | Buffer): Promise<string>;
    getFile(filePath: string): Promise<Buffer | null>;
}

class LocalStorageProvider implements IStorageProvider {
    private basePath: string;

    constructor() {
        this.basePath = path.join(__dirname, '../../uploads'); // Stores in server/uploads
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    async saveFile(filePath: string, content: string | Buffer): Promise<string> {
        // Ensure subdirectories exist (e.g., company_id/year/month)
        const fullPath = path.join(this.basePath, filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await fs.promises.writeFile(fullPath, content);
        return fullPath; // In Azure, this would be the Blob URL
    }

    async getFile(filePath: string): Promise<Buffer | null> {
        const fullPath = path.join(this.basePath, filePath);
        try {
            return await fs.promises.readFile(fullPath);
        } catch (e) {
            return null;
        }
    }
}

// TODO: Implement AzureBlobStorageProvider using @azure/storage-blob

// Export singleton based on Env
const storageService = new LocalStorageProvider();
export default storageService;
