/**
 * Get NOVAHDL logo as base64 data URL
 * This ensures the logo is embedded in downloaded HTML/PDF files
 */
export async function getLogoBase64(): Promise<string> {
  try {
    // Try to fetch the logo from public assets
    const response = await fetch("/assets/novahdl_logo-removebg-preview.png");
    if (!response.ok) {
      throw new Error("Failed to fetch logo");
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    // Return a placeholder or empty string if logo can't be loaded
    return "";
  }
}

