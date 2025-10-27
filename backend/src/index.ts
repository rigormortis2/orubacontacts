import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/contacts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/contacts', contactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Oruba Contacts API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
