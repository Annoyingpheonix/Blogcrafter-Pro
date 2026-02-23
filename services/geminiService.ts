import { GoogleGenAI, Type } from "@google/genai";
import { Idea } from "../types";

// Initialize Gemini Client
// IMPORTANT: API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
  FAST_TEXT: "gemini-3-flash-preview",
  COMPLEX_TEXT: "gemini-3-pro-preview",
  IMAGE_FAST: "gemini-2.5-flash-image",
  IMAGE_PRO: "gemini-3-pro-image-preview",
};

/**
 * Generates blog post ideas based on a topic.
 */
export const generateBlogIdeas = async (topic: string): Promise<Idea[]> => {
  try {
    const prompt = `Generate 3 creative and engaging blog post ideas about: "${topic}".
    Return the response as a JSON array. Each item should have a 'title', a short 'summary', and an 'outline' (array of strings).`;

    const response = await ai.models.generateContent({
      model: MODELS.FAST_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              outline: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "summary", "outline"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText) as Idea[];
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate ideas. Please try again.");
  }
};

/**
 * Generates a full blog post draft based on an outline.
 */
export const generateFullDraft = async (title: string, outline: string[]): Promise<string> => {
  try {
    const prompt = `Write a comprehensive, professional, and engaging blog post formatted in Markdown.
    Title: ${title}
    Outline:
    ${outline.map(item => `- ${item}`).join('\n')}

    Requirements:
    - Use H1 for the title (if not already present).
    - Use H2 and H3 for sections.
    - Include an engaging introduction and a strong conclusion.
    - Write in a clear, conversational but professional tone.
    - Ensure the content is optimized for readability.
    `;

    const response = await ai.models.generateContent({
      model: MODELS.FAST_TEXT,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating draft:", error);
    throw new Error("Failed to generate draft.");
  }
};

/**
 * Refines a specific section of text (Rewrite, Expand, Shorten).
 */
export const refineText = async (text: string, instruction: string): Promise<string> => {
  try {
    const prompt = `You are a professional editor.
    Instruction: ${instruction}
    
    Original Text:
    "${text}"
    
    Return ONLY the rewritten text. Do not add conversational filler like "Here is the rewritten text".`;

    const response = await ai.models.generateContent({
      model: MODELS.FAST_TEXT,
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Error refining text:", error);
    throw error;
  }
};

/**
 * Analyzes the blog post content using a complex model.
 */
export const analyzeContent = async (text: string): Promise<string> => {
  try {
    const prompt = `You are a strict, world-class editor. Analyze the following blog post content.
    Provide a concise but deep critique formatted in Markdown focusing on:
    1. **Tone and Voice**: Is it consistent? Who is the audience?
    2. **Structural Flow**: Are transitions smooth?
    3. **SEO & Keywords**: Suggestions for improvement.
    4. **Engagement**: How to make it stickier.
    
    Content:
    "${text}"`;

    const response = await ai.models.generateContent({
      model: MODELS.COMPLEX_TEXT,
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error analyzing content:", error);
    throw error;
  }
};

export interface ImageGenerationOptions {
  usePro: boolean;
  size?: '1K' | '2K' | '4K';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

/**
 * Generates a featured image for a blog post.
 */
export const generateFeaturedImage = async (prompt: string, options: ImageGenerationOptions = { usePro: false }): Promise<string> => {
  try {
    const model = options.usePro ? MODELS.IMAGE_PRO : MODELS.IMAGE_FAST;
    
    const imageConfig: any = {
      aspectRatio: options.aspectRatio || "16:9",
    };
    
    // Only Pro model supports imageSize
    if (options.usePro && options.size) {
      imageConfig.imageSize = options.size;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image.");
  }
};

/**
 * Edits an existing image based on a text prompt using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Extract mime type if present, default to png
    const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE_FAST,
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: mimeType, 
              data: base64Data 
            } 
          },
          { text: prompt }
        ]
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit image.");
  }
};
