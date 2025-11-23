import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Track if Cloudinary has been configured
let cloudinaryConfigured = false;

// Function to configure Cloudinary (lazy initialization)
function configureCloudinary() {
  if (cloudinaryConfigured) {
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Log Cloudinary configuration status
  console.log('[Cloudinary Config] Cloud name:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Not set');
  console.log('[Cloudinary Config] API key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('[Cloudinary Config] API secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Not set');
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('[Cloudinary Config] All Cloudinary credentials are configured');
    cloudinaryConfigured = true;
  } else {
    console.warn('[Cloudinary Config] Warning: Some Cloudinary credentials are missing. Image uploads may fail.');
  }
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    // Configure Cloudinary if not already configured
    configureCloudinary();

    const userId = req.user._id;
    const { name, email } = req.body;
    let profilePicture = req.body.profilePicture;

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        // Convert buffer to stream
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'finora/profiles',
            transformation: [{ width: 500, height: 500, crop: 'fill' }],
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return res.status(500).json({ message: 'Failed to upload image' });
            }
            profilePicture = result.secure_url;
            updateUserProfile();
          }
        );

        Readable.from(req.file.buffer).pipe(stream);
        return; // Will continue in callback
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    // If profilePicture is provided as base64 or URL string
    if (req.body.profilePicture && !req.file) {
      // If it's a base64 string, upload to Cloudinary
      if (req.body.profilePicture.startsWith('data:image')) {
        try {
          const result = await cloudinary.uploader.upload(req.body.profilePicture, {
            folder: 'finora/profiles',
            transformation: [{ width: 500, height: 500, crop: 'fill' }],
          });
          profilePicture = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({ message: 'Failed to upload image' });
        }
      } else {
        // It's already a URL, use as-is
        profilePicture = req.body.profilePicture;
      }
    }

    updateUserProfile();

    async function updateUserProfile() {
      try {
        const updateData = {};
        if (name) updateData.name = name;
        if (email) {
          // Check if email is already taken by another user
          const emailExists = await User.findOne({ email, _id: { $ne: userId } });
          if (emailExists) {
            return res.status(400).json({ message: 'Email already in use' });
          }
          updateData.email = email;
        }
        if (profilePicture) updateData.profilePicture = profilePicture;

        const user = await User.findByIdAndUpdate(userId, updateData, {
          new: true,
          runValidators: true,
        }).select('-password');

        res.json(user);
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

