const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

class OCRService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing OCR Service...');
      // Just mark as initialized since Tesseract will initialize when needed
      this.isInitialized = true;
      console.log('✅ OCR Service initialized successfully');
    } catch (error) {
      console.error('❌ OCR Service initialization failed:', error);
      // Don't throw error, just mark as not initialized
      this.isInitialized = false;
    }
  }

  async extractTruckNumber(imagePath) {
    try {
      console.log(`🔍 Processing image for OCR: ${imagePath}`);

      // Use Tesseract directly
      const {
        data: { text },
      } = await Tesseract.recognize(imagePath, 'eng', {
        logger: m => console.log(m),
      });

      console.log(`📝 Raw OCR text: ${text}`);

      // Extract truck number from OCR text
      const truckNumber = this.extractTruckNumberFromText(text);

      console.log(`🚛 Extracted truck number: ${truckNumber}`);

      return truckNumber;
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      return null;
    }
  }

  extractTruckNumberFromText(text) {
    if (!text) return null;

    // Clean the text
    const cleanText = text.replace(/\s+/g, '').toUpperCase();
    console.log(`🧹 Cleaned text: ${cleanText}`);

    // Truck number patterns (Indian format)
    const patterns = [
      // Standard format: KA01AB1234
      /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/g,
      // With hyphens: KA-01-AB-1234
      /[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}/g,
      // With spaces: KA 01 AB 1234
      /[A-Z]{2}\s[0-9]{2}\s[A-Z]{1,2}\s[0-9]{4}/g,
      // Flexible format
      /[A-Z]{2}[\s\-]?[0-9]{2}[\s\-]?[A-Z]{1,2}[\s\-]?[0-9]{4}/g,
    ];

    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first match, cleaned up
        const match = matches[0].replace(/[\s\-]/g, '');
        console.log(`✅ Found truck number: ${match}`);
        return match;
      }
    }

    // If no pattern matches, try to extract any alphanumeric sequence that might be a truck number
    const alphanumericPattern = /[A-Z]{2,3}[0-9]{2,4}[A-Z]{1,3}[0-9]{3,4}/g;
    const alphanumericMatches = cleanText.match(alphanumericPattern);

    if (alphanumericMatches && alphanumericMatches.length > 0) {
      const match = alphanumericMatches[0];
      console.log(`⚠️ Found potential truck number: ${match}`);
      return match;
    }

    console.log('❌ No truck number found in text');
    return null;
  }

  async terminate() {
    this.isInitialized = false;
    console.log('🔌 OCR Service terminated');
  }
}

// Create singleton instance
const ocrService = new OCRService();

module.exports = ocrService;
