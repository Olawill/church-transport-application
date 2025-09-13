import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "../../../../lib/analytics";

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    // Verify the user ID matches the session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine the OAuth provider from the session
    // This is a simplified approach - in production you might want to store provider info
    const provider = "oauth"; // Default fallback

    // You could enhance this by storing the provider in user metadata or account linking
    // For now, we'll use a generic 'oauth' provider name

    // Track OAuth completion
    await AnalyticsService.trackOAuthCompletion(userId, provider);

    // Also track user registration for OAuth users completing their profile
    await AnalyticsService.trackUserRegistration(userId, "oauth", provider);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OAuth completion tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
