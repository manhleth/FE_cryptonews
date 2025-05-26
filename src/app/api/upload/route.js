// src/app/api/upload/route.js
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    console.log("=== UPLOAD API STARTED ===");
    
    // Lấy dữ liệu form từ request
    const formData = await request.formData();
    const file = formData.get("image");
    
    // Kiểm tra có file hay không
    if (!file || typeof file === "string") {
      console.error("No file provided or file is string");
      return new Response(JSON.stringify({ 
        error: "No file provided",
        success: false 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log("Received file:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validation: Kiểm tra kích thước file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("File too large:", file.size);
      return new Response(JSON.stringify({ 
        error: "File too large. Maximum size is 5MB",
        success: false,
        details: `File size: ${file.size} bytes, Max: ${maxSize} bytes`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validation: Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return new Response(JSON.stringify({ 
        error: "Invalid file type. Only JPG, PNG, GIF, WEBP are allowed",
        success: false,
        allowedTypes: allowedTypes,
        receivedType: file.type
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Tạo tên file unique để tránh trùng lặp
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const uniqueFileName = `${timestamp}-${randomString}.${fileExtension}`;

    console.log("Generated unique filename:", uniqueFileName);

    // Chuyển file thành Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer created, size:", buffer.length);

    // Xác định thư mục lưu file
    const uploadDir = path.join(process.cwd(), "public", "placeholder", "400");
    console.log("Upload directory:", uploadDir);
    
    // Tạo thư mục nếu chưa tồn tại
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
      console.log("Directory created/verified");
    } catch (mkdirError) {
      console.error("Error creating directory:", mkdirError);
      return new Response(JSON.stringify({ 
        error: "Failed to create upload directory",
        success: false,
        details: mkdirError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lưu file với tên unique
    const filePath = path.join(uploadDir, uniqueFileName);
    try {
      await fs.promises.writeFile(filePath, buffer);
      console.log("File saved successfully to:", filePath);
      
      // Kiểm tra file đã được lưu chưa
      const stats = await fs.promises.stat(filePath);
      console.log("File stats:", {
        size: stats.size,
        created: stats.birthtime
      });
      
    } catch (writeError) {
      console.error("Error writing file:", writeError);
      return new Response(JSON.stringify({ 
        error: "Failed to save file",
        success: false,
        details: writeError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Trả về đường dẫn file công khai
    const publicPath = `/placeholder/400/${uniqueFileName}`;
    
    console.log("=== UPLOAD SUCCESS ===");
    console.log("Public path:", publicPath);
    
    const response = {
      filePath: publicPath,
      success: true,
      fileName: uniqueFileName,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString()
    };
    
    console.log("Response data:", response);
    
    return new Response(JSON.stringify(response), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("=== UPLOAD ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: "Error uploading file",
      success: false,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle GET requests (optional - for testing)
export async function GET() {
  return new Response(JSON.stringify({
    message: "Upload API is working",
    methods: ["POST"],
    maxFileSize: "5MB",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}