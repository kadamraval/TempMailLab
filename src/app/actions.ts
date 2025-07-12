"use server";

import { generateTempEmail } from "@/ai/flows/generate-temp-email";

export async function generateTempEmailAction() {
  try {
    const result = await generateTempEmail({});
    return result.email;
  } catch (error) {
    console.error("Error generating temporary email:", error);
    return null;
  }
}
