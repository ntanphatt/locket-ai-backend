const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Hàm lấy prompt
function getPromptForFilter(filterName) {
    const name = (filterName || '').toLowerCase();
    const prompts = {
        'anime': 'Anime style, large expressive eyes, stylized hair, bright pastel background. Keep original face features',
        '3d': '3D Pixar style, soft shading, big eyes, friendly expression. Keep original pose',
        'cartoon': 'Cartoon style, vibrant colors, smooth shading, playful. Keep original face features',
        'watercolor': 'Watercolor painting, pastel tones, gentle brush strokes, dreamy atmosphere',
    };
    for (const key of Object.keys(prompts)) {
        if (name.includes(key)) return prompts[key];
    }
    return 'Artistic style, keep original facial features';
}

// Endpoint xử lý ảnh
app.post('/generateFilteredImage', upload.single('image'), async (req, res) => {
    try {
        const filterName = req.body.filter_name || 'anime';
        let prompt = getPromptForFilter(filterName);
        
        // Xóa các ký tự đặc biệt ở cuối prompt để URL không bị lỗi
        prompt = prompt.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
        
        console.log(`🎨 Prompt đã làm sạch: ${prompt}`);

        // Mã hóa prompt
        const encodedPrompt = encodeURIComponent(prompt);
        
        // Tạo URL (Dùng seed ngẫu nhiên để ảnh không bị trùng lặp)
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;

        console.log(`🔗 Đang tải ảnh từ: ${imageUrl}`);

        // Tải ảnh (Thêm thời gian chờ 30 giây)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const imageResponse = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!imageResponse.ok) {
            throw new Error(`Lỗi từ Pollinations: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        console.log(`✅ Đã tải xong ảnh (${(imageBuffer.byteLength / 1024).toFixed(1)} KB)`);

        // Trả ảnh về
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(Buffer.from(imageBuffer));

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => res.send('Server Pollinations đang chạy!'));

app.listen(3000, () => console.log('🚀 Server chạy tại http://localhost:3000'));