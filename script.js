// Node/Express server (install: express, axios, multer, dotenv)
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(express.json({limit:'2mb'}));

app.post('/generate', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({error:'missing prompt'});

  try {
    // Example: POST to external 3D API
    // NOTE: change URL, payload, headers to match the service you choose.
    const apiResp = await axios.post(process.env.THIRD_PARTY_3D_API_URL, {
      prompt: prompt,
      // other model params...
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.THIRD_PARTY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer' // expecting binary (GLB/OBJ)
    });

    // Save file temporarily
    const id = uuidv4();
    const ext = 'glb'; // or 'obj' depending on API
    const path = `./tmp/${id}.${ext}`;
    fs.writeFileSync(path, apiResp.data);

    // Return URL (in production put on S3 and return an S3 URL)
    return res.json({ url: `/download/${id}.${ext}` });

  } catch (err) {
    console.error('generate error', err.response?.data || err.message);
    res.status(500).json({ error: 'generation failed' });
  }
});

// Simple static file serve for downloaded files (dev only)
app.use('/download', express.static('./tmp'));

app.listen(3000, () => console.log('Server running on :3000'));
