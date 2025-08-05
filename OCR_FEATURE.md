# 🚛 Truck Number OCR Capture Feature

## Overview
The CrusherMate app now includes an intelligent OCR (Optical Character Recognition) feature that automatically extracts truck numbers from captured images of truck number plates.

## Features

### 📷 Camera Integration
- **Camera Button**: A camera icon (📷) next to the truck number input field
- **Image Capture**: Take photos of truck number plates directly from the app
- **Gallery Selection**: Choose existing images from device gallery
- **Real-time Processing**: OCR processing happens immediately after image capture

### 🔍 OCR Capabilities
- **Multiple Formats**: Supports various Indian truck number formats:
  - `TN 02 AB 1234` (Standard format)
  - `TN 02 1234` (Simplified format)
  - `TN 1234 AB` (Alternative format)
  - `TN 02 A 1234` (Single letter format)
  - `TN 2 AB 1234` (Single digit format)

### 🎯 Smart Recognition
- **Auto-formatting**: Automatically converts to uppercase and removes spaces
- **Pattern Matching**: Uses regex patterns to identify valid truck numbers
- **Fallback Handling**: Graceful error handling if OCR fails
- **Manual Override**: Users can still manually enter truck numbers

## How to Use

### 1. Capture Truck Number
1. Tap the camera icon (📷) next to the "Truck Number" field
2. Choose "Take Photo" to capture with camera
3. Or choose "Choose from Gallery" to select existing image
4. Point camera at the truck number plate
5. Take the photo

### 2. Automatic Processing
- The app will process the image using OCR
- If a valid truck number is found, it will be auto-filled
- A success message will show the extracted number
- If no number is found, you can enter it manually

### 3. Manual Entry
- You can still manually type the truck number
- The field auto-converts to uppercase
- Spaces are automatically removed

## Technical Details

### OCR Service
- Uses **OCR.space API** for text extraction
- Free tier with 500 requests per day
- Supports multiple image formats (JPEG, PNG, etc.)

### Image Processing
- Images are optimized before OCR processing
- Maximum dimensions: 1000x1000 pixels
- Quality setting: 0.8 (80%)

### Error Handling
- Network connectivity issues
- Invalid image formats
- No text detected in image
- Invalid truck number patterns

## Benefits

### ⚡ Efficiency
- **Faster Entry**: No need to manually type truck numbers
- **Reduced Errors**: Eliminates typos in truck number entry
- **Time Savings**: Speeds up the data entry process

### 🎯 Accuracy
- **Pattern Validation**: Ensures valid truck number formats
- **Auto-formatting**: Consistent formatting across entries
- **Error Prevention**: Reduces manual entry mistakes

### 📱 User Experience
- **Intuitive Interface**: Camera icon clearly indicates functionality
- **Loading Indicators**: Shows processing status
- **Clear Feedback**: Success/error messages guide users

## Troubleshooting

### Common Issues

1. **"OCR Failed" Message**
   - Check internet connection
   - Ensure image is clear and well-lit
   - Try capturing image again

2. **"No Truck Number Found"**
   - Ensure truck number plate is clearly visible
   - Check if number follows standard Indian format
   - Try manual entry if OCR fails

3. **Camera Not Working**
   - Grant camera permissions in device settings
   - Restart the app if needed

### Best Practices

1. **Image Quality**
   - Ensure good lighting
   - Keep camera steady
   - Focus on the number plate clearly

2. **Number Plate Visibility**
   - Clean number plate surface
   - Avoid shadows or reflections
   - Capture from appropriate distance

3. **Format Recognition**
   - Use standard Indian truck number formats
   - Ensure numbers and letters are clearly visible
   - Avoid blurry or damaged number plates

## Future Enhancements

- **Offline OCR**: Local processing without internet
- **Multiple Languages**: Support for regional number formats
- **AI Enhancement**: Better recognition accuracy
- **Batch Processing**: Process multiple images at once

---

*This feature enhances the CrusherMate app's efficiency and accuracy for truck entry management.* 