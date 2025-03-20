const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for hairstyles
const hairstyleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hairstyles',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

// Create storage engine for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

// Create storage engine for facemesh
const facemeshStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'facemesh',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

module.exports = {
  cloudinary,
  uploadHairstyle: multer({ storage: hairstyleStorage }),
  uploadProfile: multer({ storage: profileStorage }),
  uploadFacemesh: multer({ storage: facemeshStorage })
};
