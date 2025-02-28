import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { IncomingMessage } from 'http';

// Tắt body parser mặc định để dùng formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  return new Promise<NextResponse>((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), 'public/images/news');

    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      multiples: false,
    });

    // Ép kiểu request thành IncomingMessage để formidable có thể xử lý
    form.parse(request as unknown as IncomingMessage, (err, fields, files) => {
      if (err) {
        console.error("Error parsing the files", err);
        return resolve(NextResponse.json({ error: "Error parsing the files" }, { status: 500 }));
      }
      
      const fileField = files.image;
      if (!fileField) {
        return resolve(NextResponse.json({ error: "No file uploaded" }, { status: 400 }));
      }

      // Nếu fileField là mảng, lấy phần tử đầu tiên
      let file: formidable.File;
      if (Array.isArray(fileField)) {
        file = fileField[0];
      } else {
        file = fileField;
      }
      
      const oldPath = file.filepath;
      const fileName = file.originalFilename || "unknown";
      const newPath = path.join(uploadDir, fileName);

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.error("Error saving file", err);
          return resolve(NextResponse.json({ error: "Error saving file" }, { status: 500 }));
        }
        // Trả về đường dẫn file đã lưu, ví dụ: /images/news/123.jpg
        const imageUrl = `/images/news/${fileName}`;
        resolve(NextResponse.json({ imageUrl }, { status: 200 }));
      });
    });
  });
}
