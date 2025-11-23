import dotenv from 'dotenv';

// Load environment variables from .env file
// dotenv.config() by default looks for .env in the current working directory
const result = dotenv.config();

if (result.error) {
  console.warn('[Env Config] Warning: Could not load .env file:', result.error.message);
  console.warn('[Env Config] Make sure .env file exists in the server/ directory');
} else {
  console.log('[Env Config] Environment variables loaded successfully');
  // Log which important env vars are set (without showing values)
  console.log('[Env Config] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('[Env Config] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Not set');
  console.log('[Env Config] CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('[Env Config] CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Not set');
  console.log('[Env Config] MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Not set');
  console.log('[Env Config] JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Not set');
}

export default result;

