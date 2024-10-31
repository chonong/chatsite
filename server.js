const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

app.use(express.static('.'));
app.use(bodyParser.json());

const db = new sqlite3.Database('./chat.db');

// 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT,
    sender TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// 라우팅 추가
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/api/messages', (req, res) => {
    const { channel } = req.query;
    db.all(
        "SELECT * FROM messages WHERE channel = ? ORDER BY timestamp",
        [channel],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.post('/api/messages', (req, res) => {
    const { channel, sender, content } = req.body;
    db.run(
        "INSERT INTO messages (channel, sender, content) VALUES (?, ?, ?)",
        [channel, sender, content],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const newMessage = { id: this.lastID, channel, sender, content };
            io.to(channel).emit('new message', newMessage);
            res.json(newMessage);
        }
    );
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join channel', (channel) => {
        socket.join(channel);
    });

    socket.on('leave channel', (channel) => {
        socket.leave(channel);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});