// src/app/api/dialogflow-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Interface cho Dialogflow request
interface DialogflowRequest {
  queryResult: {
    queryText: string;
    parameters: any;
    intent: {
      displayName: string;
    };
  };
  session: string;
}

// Interface cho response
interface DialogflowResponse {
  fulfillmentText?: string;
  fulfillmentMessages?: any[];
}

export async function POST(request: NextRequest) {
  try {
    const body: DialogflowRequest = await request.json();
    
    console.log('Dialogflow Request:', JSON.stringify(body, null, 2));
    
    const intentName = body.queryResult.intent.displayName;
    const parameters = body.queryResult.parameters;
    const queryText = body.queryResult.queryText;
    
    let response: DialogflowResponse = {};
    
    // Handle different intents
    switch (intentName) {
      case 'crypto.price.inquiry':
        response = await handleCryptoPriceInquiry(parameters);
        break;
        
      case 'crypto.news.inquiry':
        response = await handleCryptoNewsInquiry();
        break;
        
      case 'crypto.trading.guide':
        response = handleTradingGuide();
        break;
        
      default:
        response = {
          fulfillmentText: "Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể hỏi về giá crypto, tin tức, hoặc hướng dẫn trading."
        };
    }
    
    console.log('Dialogflow Response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      fulfillmentText: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau."
    }, { status: 500 });
  }
}

// Handler cho crypto price inquiry
async function handleCryptoPriceInquiry(parameters: any): Promise<DialogflowResponse> {
  const cryptoCurrency = parameters['crypto-currency'];
  
  if (!cryptoCurrency) {
    return {
      fulfillmentText: "Bạn muốn xem giá của đồng coin nào? Ví dụ: Bitcoin, Ethereum, Dogecoin..."
    };
  }
  
  try {
    // Mapping các tên coin phổ biến
    const coinMapping: { [key: string]: string } = {
      'bitcoin': 'bitcoin',
      'btc': 'bitcoin',
      'ethereum': 'ethereum',
      'eth': 'ethereum',
      'dogecoin': 'dogecoin',
      'doge': 'dogecoin',
      'solana': 'solana',
      'sol': 'solana',
      'cardano': 'cardano',
      'ada': 'cardano',
      'binance coin': 'binancecoin',
      'bnb': 'binancecoin',
      'ripple': 'ripple',
      'xrp': 'ripple'
    };
    
    const coinId = coinMapping[cryptoCurrency.toLowerCase()] || cryptoCurrency.toLowerCase();
    
    console.log(`Fetching price for coin: ${coinId}`);
    
    // Gọi CoinGecko API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('CoinGecko response:', data);
    
    if (data[coinId]) {
      const price = data[coinId].usd;
      const change24h = data[coinId].usd_24h_change;
      
      const changeText = change24h > 0 
        ? `📈 tăng ${change24h.toFixed(2)}%` 
        : `📉 giảm ${Math.abs(change24h).toFixed(2)}%`;
      
      return {
        fulfillmentText: `💰 Giá ${cryptoCurrency.toUpperCase()} hiện tại:
        
🔸 Giá: $${price.toLocaleString()} USD
🔸 24h: ${changeText}

Bạn có muốn xem giá của coin khác không? 🚀`
      };
    } else {
      return {
        fulfillmentText: `❌ Không tìm thấy thông tin giá cho "${cryptoCurrency}". 

Vui lòng kiểm tra lại tên coin hoặc thử với:
• Bitcoin (BTC)
• Ethereum (ETH) 
• Dogecoin (DOGE)
• Solana (SOL)`
      };
    }
    
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return {
      fulfillmentText: `⚠️ Không thể lấy thông tin giá ${cryptoCurrency} lúc này. 

Bạn có thể:
• Thử lại sau vài phút
• Xem giá trực tiếp trên trang chủ
• Sử dụng widget trading bên phải màn hình

Tôi có thể hỗ trợ gì khác không? 🤔`
    };
  }
}

// Handler cho crypto news inquiry
async function handleCryptoNewsInquiry(): Promise<DialogflowResponse> {
  try {
    // Gọi API backend của bạn để lấy tin tức
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/News/GetNewest`);
    
    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.statusCode === 1 && data.data && data.data.length > 0) {
      const latestNews = data.data.slice(0, 3); // Lấy 3 tin mới nhất
      
      let newsText = '📰 **Tin tức crypto mới nhất:**\n\n';
      
      latestNews.forEach((news: any, index: number) => {
        newsText += `${index + 1}. **${news.header}**\n`;
        newsText += `   👤 ${news.userName || 'Admin'}\n`;
        newsText += `   ⏱️ ${news.timeReading || 5} phút đọc\n\n`;
      });
      
      newsText += `🔗 Xem chi tiết trên website của chúng tôi!\n\nBạn muốn biết về chủ đề nào khác? 💭`;
      
      return {
        fulfillmentText: newsText
      };
    } else {
      return {
        fulfillmentText: `📭 Hiện tại chưa có tin tức mới.

🔄 Vui lòng:
• Kiểm tra lại sau
• Truy cập trang chủ để xem bài viết
• Đăng ký nhận thông báo tin tức

Tôi có thể hỗ trợ gì khác không? 🤗`
      };
    }
    
  } catch (error) {
    console.error('Error fetching news:', error);
    return {
      fulfillmentText: `⚠️ Không thể tải tin tức lúc này.

📱 Bạn có thể:
• Truy cập trang chủ trực tiếp
• Xem mục "Tin tức mới nhất"
• Theo dõi các bài viết nổi bật

Tôi có thể hỗ trợ gì khác không? 💪`
    };
  }
}

// Handler cho trading guide
function handleTradingGuide(): DialogflowResponse {
  return {
    fulfillmentText: `🚀 **Hướng dẫn Trading Crypto cơ bản:**

📚 **1. Học kiến thức nền tảng:**
• Tìm hiểu về blockchain & cryptocurrency
• Nắm vững các thuật ngữ cơ bản
• Đọc whitepaper của các dự án

🏦 **2. Chọn sàn giao dịch uy tín:**
• Binance, Coinbase, OKX
• Kiểm tra license & bảo mật
• Phí giao dịch hợp lý

💰 **3. Quản lý vốn thông minh:**
• Chỉ đầu tư số tiền có thể mất
• Đa dạng hóa danh mục
• Không bao giờ vay để đầu tư

📈 **4. Học phân tích:**
• Technical Analysis (TA)
• Fundamental Analysis (FA)
• Sentiment Analysis

⚠️ **5. Quản lý rủi ro:**
• Luôn đặt stop-loss
• Không FOMO (Fear of Missing Out)
• Take profit từng phần

🎯 Bạn muốn tìm hiểu sâu hơn về chủ đề nào?`
  };
}

// Handle GET request (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Dialogflow Webhook is running!",
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: "/api/dialogflow-webhook",
      method: "POST"
    }
  });
}