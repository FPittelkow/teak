const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

app.use(express.json());
app.use(express.static('public'));

// Helper to read tea data
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        // Seed default data if file doesn't exist
        const defaultData = [
            { id: 1, name: "Earl Grey","manufacturer": "Meßmer", votes: 5, stock: false },
            { id: 2, name: "Green Tea Sencha","manufacturer": "Teekanne", votes: 3, stock: false },
            { id: 3, name: "Peppermint","manufacturer": "Meßmer", votes: 1, stock: false }
        ];
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

// Helper to write tea data
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API: Get ranked teas
app.get('/api/teas', (req, res) => {
    const teas = readData();
    // Sort descending by vote count
    teas.sort((a, b) => b.votes - a.votes);
    res.json(teas);
});

app.get('/api/teas/in-stock', (req, res) => {
    const teas = readData();

    // 1. Filter out only the teas where stock is explicitly true
    const inStockTeas = teas.filter(tea => tea.stock === true);

    // 2. Send the filtered list back to the frontend
    res.json(inStockTeas);
});

// API: Add a new tea
app.post('/api/teas', (req, res) => {
    // 1. Extract BOTH name and manufacturer from the incoming request body
    const { name, manufacturer } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const teas = readData();

    // 2. Fallback to an empty string if no manufacturer was provided
    const newTea = {
        id: Date.now(),
        name,
        manufacturer: manufacturer || "",
        stock: false,
        votes: 0
    };

    teas.push(newTea);
    writeData(teas);
    res.status(201).json(newTea);
});


// API: Upvote/Downvote a tea
app.post('/api/teas/:id/vote', (req, res) => {
    const { direction } = req.body; // "up" or "down"
    const id = parseInt(req.params.id);
    const teas = readData();
    const tea = teas.find(t => t.id === id);

    if (!tea) return res.status(404).json({ error: 'Tea not found' });

    if (direction === 'up'){
        tea.votes += 1;
        tea.stock = true;
    }
    if (direction === 'down'){
        tea.votes = Math.max(0, tea.votes - 1); // Prevent negative ranks
        tea.stock = false;
    }

    if (direction === 'stock'){
        tea.stock = false;
    }
    writeData(teas);
    res.json(tea);
});

app.listen(PORT, () => console.log(`Teak running on port ${PORT}`));