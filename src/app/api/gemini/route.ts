// src/app/api/gemini/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Debug log để check API key
    console.log("API Key exists:", !!process.env.GOOGLE_AI_API_KEY);
    
    // Validate API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error("Google AI API key not found in environment variables");
      return NextResponse.json(
        { 
          error: "Google AI API key not configured",
          success: false 
        },
        { status: 500 }
      );
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { 
          error: "Message is required",
          success: false 
        },
        { status: 400 }
      );
    }

    // Initialize Gemini model
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create crypto-specific context
    const cryptoContext = `
Bạn là CryptoChatBot - một AI assistant chuyên về cryptocurrency và blockchain cho website tin tức crypto Việt Nam.

NHIỆM VỤ CHÍNH:
✅ Trả lời câu hỏi về cryptocurrency, blockchain, DeFi, NFT, Web3
✅ Phân tích thị trường crypto và xu hướng giá
✅ Giải thích thuật ngữ crypto cho người mới bắt đầu
✅ Tư vấn về trading, đầu tư (không phải lời khuyên tài chính)
✅ Cập nhật tin tức và sự kiện crypto mới nhất
✅ Hướng dẫn sử dụng ví, exchange, DeFi protocols

PHONG CÁCH TRUYỀN THÔNG:
- Sử dụng tiếng Việt tự nhiên, thân thiện
- Giải thích đơn giản, dễ hiểu
- Đưa ví dụ cụ thể khi cần
- Luôn nhắc nhở về rủi ro đầu tư
- Không đưa lời khuyên tài chính cụ thể

LƯU Ý AN TOÀN:
⚠️ Luôn nhắc nhở: "Đây không phải lời khuyên tài chính, hãy tự nghiên cứu kỹ"
⚠️ Cảnh báo về rủi ro cao của crypto
⚠️ Khuyến khích học hỏi và nghiên cứu trước khi đầu tư

Câu hỏi của người dùng: ${message}
`;

    // Build conversation context
    const fullPrompt = conversationHistory.length > 0 
      ? `${cryptoContext}\n\nLịch sử hội thoại:\n${conversationHistory.map((msg: any, index: number) => 
          `${index % 2 === 0 ? 'User' : 'Bot'}: ${msg}`
        ).join('\n')}\n\nCâu hỏi mới: ${message}`
      : cryptoContext;

    console.log("Sending request to Gemini...");

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log("Gemini response received successfully");

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle specific errors
    if (error?.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json(
        { 
          error: "API key không hợp lệ. Vui lòng kiểm tra lại.",
          success: false 
        },
        { status: 401 }
      );
    }
    
    if (error?.message?.includes('QUOTA_EXCEEDED')) {
      return NextResponse.json(
        { 
          error: "Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.",
          success: false 
        },
        { status: 429 }
      );
    }

    if (error?.message?.includes('SAFETY')) {
      return NextResponse.json(
        { 
          error: "Câu hỏi của bạn có thể vi phạm chính sách an toàn. Vui lòng thử câu hỏi khác.",
          success: false 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
        success: false,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}