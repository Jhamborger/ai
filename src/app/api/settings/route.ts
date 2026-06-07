import { NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const settings = await getSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = settingsSchema.parse(await request.json());
    await updateSettings(body);
    const settings = await getSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
