const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'fusr9o7o',
  api_key: process.env.CLOUDINARY_API_KEY || '948367361431132',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'uzAq1tt2meyAbL86zBx-718aAaE',
  secure: true
});

/**
 * Cloudinary Service for high-speed CDN delivery and optimization
 */
class CloudinaryService {
  /**
   * Normalize input into a format Cloudinary uploader accepts (data URI, file path, or remote URL)
   */
  normalizeInput(input, defaultMime = 'image/jpeg') {
    if (!input || typeof input !== 'string') return input;
    const str = input.trim();
    if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
      return str;
    }
    // If raw base64 string
    if (str.length > 100 && !str.includes('/') && !str.includes('\\')) {
      return `data:${defaultMime};base64,${str}`;
    }
    return str;
  }

  /**
   * Upload Profile Image
   * Automatically crops to square, focuses on face/subject, and delivers via auto-format & auto-quality
   */
  async uploadProfileImage(imageInput, userId = 'user') {
    try {
      const source = this.normalizeInput(imageInput, 'image/jpeg');
      const publicId = `profile_${userId}_${Date.now()}`;

      const uploadResult = await cloudinary.uploader.upload(source, {
        folder: 'fundapp/profiles',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });

      // Generate optimized delivery URL
      const optimizedUrl = cloudinary.url(uploadResult.public_id, {
        secure: true,
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });

      return {
        success: true,
        url: optimizedUrl || uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary uploadProfileImage error:', error.message || error);
      return { success: false, error: error.message || error };
    }
  }

  /**
   * Upload Chat Image
   * Optimizes delivery by applying auto-format and auto-quality with max limit
   */
  async uploadChatImage(imageInput, roomId = 'chat') {
    try {
      const source = this.normalizeInput(imageInput, 'image/jpeg');
      const publicId = `chat_${roomId}_${Date.now()}_${Math.round(Math.random() * 1e5)}`;

      const uploadResult = await cloudinary.uploader.upload(source, {
        folder: 'fundapp/chat',
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { width: 1400, crop: 'limit' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });

      const optimizedUrl = cloudinary.url(uploadResult.public_id, {
        secure: true,
        transformation: [
          { width: 1400, crop: 'limit' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });

      return {
        success: true,
        url: optimizedUrl || uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary uploadChatImage error:', error.message || error);
      return { success: false, error: error.message || error };
    }
  }

  /**
   * Upload Group/Room Avatar
   */
  async uploadGroupAvatar(imageInput, groupId = 'group') {
    try {
      const source = this.normalizeInput(imageInput, 'image/jpeg');
      const publicId = `group_${groupId}_${Date.now()}`;

      const uploadResult = await cloudinary.uploader.upload(source, {
        folder: 'fundapp/groups',
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });

      const optimizedUrl = cloudinary.url(uploadResult.public_id, {
        secure: true,
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });

      return {
        success: true,
        url: optimizedUrl || uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format
      };
    } catch (error) {
      console.error('❌ Cloudinary uploadGroupAvatar error:', error.message || error);
      return { success: false, error: error.message || error };
    }
  }

  /**
   * Upload generic file (e.g. document, audio, video)
   */
  async uploadGenericFile(fileInput, folder = 'fundapp/files', resourceType = 'auto') {
    try {
      const source = this.normalizeInput(fileInput);
      const uploadResult = await cloudinary.uploader.upload(source, {
        folder,
        resource_type: resourceType
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary uploadGenericFile error:', error.message || error);
      return { success: false, error: error.message || error };
    }
  }
}

module.exports = new CloudinaryService();
