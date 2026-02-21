import { Product } from '../types';

interface OCRResult {
  store_name: string;
  purchase_date: string;
  items: string[];
}

/**
 * Mocks the OpenAI Vision API response for invoice processing.
 * In a real implementation, this would send the image to the API.
 */
export async function processInvoiceImage(imageUri: string): Promise<OCRResult> {
  console.log(`Processing image at: ${imageUri}`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return mock data
  return {
    store_name: "FNAC Colombo",
    purchase_date: new Date().toISOString().split('T')[0], // Today
    items: [
      "MacBook Pro M3",
      "Apple Magic Mouse",
      "Adaptador USB-C",
      "Capa de Proteção"
    ]
  };
}
