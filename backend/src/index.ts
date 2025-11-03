import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/contacts';
import rawDataRoutes from './routes/rawData';
import hospitalReferencesRoutes from './routes/hospitalReferences';
import jobTitlesRoutes from './routes/jobTitles';
import hospitalTypesRoutes from './routes/hospitalTypes';
import hospitalSubtypesRoutes from './routes/hospitalSubtypes';
import personContactsRoutes from './routes/personContacts';
import citiesRoutes from './routes/cities';
import contactPersonsRoutes from './routes/contactPersons';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/contacts', contactRoutes); // TrelloMatches (existing)
app.use('/api/raw-data', rawDataRoutes);
app.use('/api/hospital-references', hospitalReferencesRoutes);
app.use('/api/job-titles', jobTitlesRoutes);
app.use('/api/hospital-types', hospitalTypesRoutes);
app.use('/api/hospital-subtypes', hospitalSubtypesRoutes);
app.use('/api/person-contacts', personContactsRoutes); // PersonContact (existing)
app.use('/api/cities', citiesRoutes);
app.use('/api/contact-persons', contactPersonsRoutes); // NEW Contact model

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Oruba Contacts API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on 0.0.0.0:${PORT}`);
});
