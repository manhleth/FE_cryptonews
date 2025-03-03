// src/app/api/upload/route.js
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    // Lấy dữ liệu form từ request (File upload là một phần của FormData)
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    // Chuyển file (File là Blob) thành Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Xác định thư mục lưu file: public/placeholder/400
    const uploadDir = path.join(process.cwd(), "public/placeholder/400");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Lưu file với tên gốc
    const filePath = path.join(uploadDir, file.name);
    await fs.promises.writeFile(filePath, buffer);

    // Trả về đường dẫn file công khai (sử dụng trong src của thẻ img)
    const publicPath = `/placeholder/400/${file.name}`;
    return new Response(JSON.stringify({ filePath: publicPath }), { status: 200 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return new Response(JSON.stringify({ error: "Error uploading file" }), { status: 500 });
  }
}
