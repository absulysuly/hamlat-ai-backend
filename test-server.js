import express from 'express';
import cors from 'cors';

console.log('✅ Express imported successfully');
console.log('✅ CORS imported successfully');

const app = express();
app.use(cors());

app.get('/test', (req, res) => {
  res.json({ message: 'Basic server test working' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌐 Test API: http://localhost:${PORT}/test`);
});
