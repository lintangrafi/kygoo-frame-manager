import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";

export async function GET() {
  try {
    // Check database connection by selecting a lightweight table
    await db.select().from(sessions).limit(1);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
