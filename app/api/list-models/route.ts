import { NextResponse } from "next/server";

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await res.json();

    // Filter to only models that support generateContent (vision capable)
    const usable = data.models
        ?.filter((m: { supportedGenerationMethods?: string[] }) =>
            m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: { name: string; displayName: string }) => ({
            name: m.name,
            displayName: m.displayName,
        }));

    return NextResponse.json({ usable });
}
