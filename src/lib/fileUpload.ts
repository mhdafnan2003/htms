import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'students');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export interface UploadedFile {
    name: string;
    url: string;
}

/**
 * Validates file type and size
 */
function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File ${file.name} exceeds maximum size of 10MB`
        };
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `File ${file.name} has unsupported type. Allowed: images (JPG, PNG, WEBP), PDF, DOC, DOCX`
        };
    }

    return { valid: true };
}

/**
 * Generates a unique filename
 */
function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${sanitizedName}_${timestamp}_${randomString}${extension}`;
}

/**
 * Ensures upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
}

/**
 * Saves a file to disk and returns the public URL
 */
export async function saveFile(file: File): Promise<UploadedFile> {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    return {
        name: file.name,
        url: `/uploads/students/${filename}`
    };
}

/**
 * Saves multiple files and returns array of uploaded file info
 */
export async function saveFiles(files: File[]): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => saveFile(file));
    return Promise.all(uploadPromises);
}
