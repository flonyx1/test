import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { 
  antiDDoS, 
  checkBlockedCountries, 
  checkAdminIP, 
  getRealIP,
  logSuspiciousActivity 
} from './middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL] 
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DB_PATH = path.join(__dirname, 'database');

app.use(antiDDoS);
app.use(checkBlockedCountries);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function initDatabase() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
    
    const files = ['users.json', 'chats.json', 'messages.json', 'admins.json', 'blocked-countries.json'];
    for (const file of files) {
      const filePath = path.join(DB_PATH, file);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, JSON.stringify([]));
      }
    }
    
    const adminsPath = path.join(DB_PATH, 'admins.json');
    const admins = JSON.parse(await fs.readFile(adminsPath, 'utf8'));
    if (admins.length === 0) {
      admins.push(
        {
          id: uuidv4(),
          ip: '127.0.0.1',
          name: 'Local Admin',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          ip: '5.253.42.8',
          name: 'Snervox',
          active: true,
          createdAt: new Date().toISOString()
        }
      );
      await fs.writeFile(adminsPath, JSON.stringify(admins, null, 2));
    }
    
  } catch (error) {
  }
}

async function readDB(filename) {
  try {
    const data = await fs.readFile(path.join(DB_PATH, filename), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeDB(filename, data) {
  await fs.writeFile(path.join(DB_PATH, filename), JSON.stringify(data, null, 2));
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logSuspiciousActivity(getRealIP(req), 'UNAUTHORIZED_ACCESS', {
      endpoint: req.path,
      userAgent: req.headers['user-agent']
    });
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logSuspiciousActivity(getRealIP(req), 'INVALID_TOKEN', {
        endpoint: req.path,
        userAgent: req.headers['user-agent']
      });
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

function getMoscowTime() {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

app.get('/api/admin/check', async (req, res) => {
  try {
    const ip = getRealIP(req);
    const admins = await readDB('admins.json');
    
    const isAdmin = admins.some(admin => admin.ip === ip && admin.active);
    res.json({ isAdmin, ip });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/stats', checkAdminIP, async (req, res) => {
  try {
    const users = await readDB('users.json');
    const chats = await readDB('chats.json');
    const messages = await readDB('messages.json');
    const admins = await readDB('admins.json');
    const blockedCountries = await readDB('blocked-countries.json');
    
    res.json({
      totalUsers: users.length,
      totalChats: chats.length,
      totalMessages: messages.length,
      totalAdmins: admins.filter(a => a.active).length,
      blockedCountries: blockedCountries.length,
      onlineUsers: users.filter(u => u.isOnline).length
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

app.post('/api/admin/add-admin', checkAdminIP, async (req, res) => {
  try {
    const { ip, name } = req.body;
    
    if (!ip || !name) {
      return res.status(400).json({ error: 'IP и имя обязательны' });
    }
    
    const admins = await readDB('admins.json');
    
    if (admins.some(admin => admin.ip === ip)) {
      return res.status(400).json({ error: 'Админ с таким IP уже существует' });
    }
    
    const newAdmin = {
      id: uuidv4(),
      ip,
      name,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: getRealIP(req)
    };
    
    admins.push(newAdmin);
    await writeDB('admins.json', admins);
    
    res.json({ success: true, admin: newAdmin });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка добавления админа' });
  }
});

app.get('/api/admin/admins', checkAdminIP, async (req, res) => {
  try {
    const admins = await readDB('admins.json');
    res.json(admins.filter(a => a.active));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка админов' });
  }
});

app.post('/api/admin/block-country', checkAdminIP, async (req, res) => {
  try {
    const { countryCode, countryName } = req.body;
    
    if (!countryCode || !countryName) {
      return res.status(400).json({ error: 'Код и название страны обязательны' });
    }
    
    const blockedCountries = await readDB('blocked-countries.json');
    
    if (blockedCountries.some(country => country.code === countryCode)) {
      return res.status(400).json({ error: 'Страна уже заблокирована' });
    }
    
    const newBlockedCountry = {
      id: uuidv4(),
      code: countryCode,
      name: countryName,
      blockedAt: new Date().toISOString(),
      blockedBy: getRealIP(req)
    };
    
    blockedCountries.push(newBlockedCountry);
    await writeDB('blocked-countries.json', blockedCountries);
    
    res.json({ success: true, country: newBlockedCountry });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка блокировки страны' });
  }
});

app.get('/api/admin/blocked-countries', checkAdminIP, async (req, res) => {
  try {
    const blockedCountries = await readDB('blocked-countries.json');
    res.json(blockedCountries);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заблокированных стран' });
  }
});

app.delete('/api/admin/unblock-country/:id', checkAdminIP, async (req, res) => {
  try {
    const { id } = req.params;
    const blockedCountries = await readDB('blocked-countries.json');
    
    const updatedCountries = blockedCountries.filter(country => country.id !== id);
    await writeDB('blocked-countries.json', updatedCountries);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка разблокировки страны' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const users = await readDB('users.json');
    
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      username,
      password: hashedPassword,
      avatar: null,
      nickname: username,
      registrationIP: getRealIP(req),
      registrationTime: getMoscowTime(),
      isOnline: false,
      lastSeen: null
    };

    users.push(newUser);
    await writeDB('users.json', users);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
    
    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        nickname: newUser.nickname,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    const users = await readDB('users.json');
    const user = users.find(u => 
      u.email === emailOrUsername || u.username === emailOrUsername
    );

    if (!user || !await bcrypt.compare(password, user.password)) {
      logSuspiciousActivity(getRealIP(req), 'FAILED_LOGIN', {
        emailOrUsername,
        userAgent: req.headers['user-agent']
      });
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/search-users', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await readDB('users.json');
    
    const results = users
      .filter(u => 
        u.id !== req.user.userId && 
        (u.username.toLowerCase().includes(query.toLowerCase()) ||
         u.nickname.toLowerCase().includes(query.toLowerCase()))
      )
      .map(u => ({
        id: u.id,
        username: u.username,
        nickname: u.nickname,
        avatar: u.avatar,
        isOnline: u.isOnline
      }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка поиска' });
  }
});

app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await readDB('chats.json');
    const userChats = chats.filter(chat => 
      chat.participants.includes(req.user.userId)
    );
    
    res.json(userChats);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки чатов' });
  }
});

app.post('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const chats = await readDB('chats.json');
    
    const existingChat = chats.find(chat => 
      chat.participants.includes(req.user.userId) && 
      chat.participants.includes(participantId)
    );
    
    if (existingChat) {
      return res.json(existingChat);
    }
    
    const newChat = {
      id: uuidv4(),
      participants: [req.user.userId, participantId],
      createdAt: new Date().toISOString(),
      lastMessage: null
    };
    
    chats.push(newChat);
    await writeDB('chats.json', chats);
    
    res.json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания чата' });
  }
});

app.delete('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { chatIds } = req.body;
    const chats = await readDB('chats.json');
    const messages = await readDB('messages.json');
    
    const updatedChats = chats.filter(chat => 
      !chatIds.includes(chat.id) || !chat.participants.includes(req.user.userId)
    );
    
    const updatedMessages = messages.filter(message => 
      !chatIds.includes(message.chatId)
    );
    
    await writeDB('chats.json', updatedChats);
    await writeDB('messages.json', updatedMessages);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления чатов' });
  }
});

app.delete('/api/chats/all', authenticateToken, async (req, res) => {
  try {
    const chats = await readDB('chats.json');
    const messages = await readDB('messages.json');
    
    const userChatIds = chats
      .filter(chat => chat.participants.includes(req.user.userId))
      .map(chat => chat.id);
    
    const updatedChats = chats.filter(chat => 
      !chat.participants.includes(req.user.userId)
    );
    
    const updatedMessages = messages.filter(message => 
      !userChatIds.includes(message.chatId)
    );
    
    await writeDB('chats.json', updatedChats);
    await writeDB('messages.json', updatedMessages);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления всех чатов' });
  }
});

app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await readDB('messages.json');
    
    const chatMessages = messages.filter(msg => msg.chatId === chatId);
    res.json(chatMessages);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки сообщений' });
  }
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  const clientIP = getRealIP(socket.request);

  socket.on('user-online', async (userId) => {
    connectedUsers.set(userId, socket.id);
    
    const users = await readDB('users.json');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].isOnline = true;
      await writeDB('users.json', users);
    }
    
    socket.broadcast.emit('user-status-changed', { userId, isOnline: true });
  });

  socket.on('send-message', async (messageData) => {
    try {
      const messages = await readDB('messages.json');
      const newMessage = {
        id: uuidv4(),
        chatId: messageData.chatId,
        senderId: messageData.senderId,
        content: messageData.content,
        type: messageData.type || 'text',
        timestamp: new Date().toISOString(),
        status: 'sent',
        readBy: [messageData.senderId]
      };
      
      messages.push(newMessage);
      await writeDB('messages.json', messages);
      
      const chats = await readDB('chats.json');
      const chatIndex = chats.findIndex(c => c.id === messageData.chatId);
      if (chatIndex !== -1) {
        chats[chatIndex].lastMessage = newMessage;
        await writeDB('chats.json', chats);
      }
      
      const chat = chats[chatIndex];
      chat.participants.forEach(participantId => {
        const socketId = connectedUsers.get(participantId);
        if (socketId) {
          io.to(socketId).emit('new-message', newMessage);
        }
      });
      
    } catch (error) {
    }
  });

  socket.on('message-read', async (data) => {
    try {
      const messages = await readDB('messages.json');
      const messageIndex = messages.findIndex(m => m.id === data.messageId);
      
      if (messageIndex !== -1) {
        if (!messages[messageIndex].readBy.includes(data.userId)) {
          messages[messageIndex].readBy.push(data.userId);
          messages[messageIndex].status = 'read';
          await writeDB('messages.json', messages);
          
          const senderSocketId = connectedUsers.get(messages[messageIndex].senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-read-update', {
              messageId: data.messageId,
              readBy: data.userId
            });
          }
        }
      }
    } catch (error) {
    }
  });

  socket.on('disconnect', async () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        
        const users = await readDB('users.json');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex].isOnline = false;
          users[userIndex].lastSeen = new Date().toISOString();
          await writeDB('users.json', users);
        }
        
        socket.broadcast.emit('user-status-changed', { userId, isOnline: false });
        break;
      }
    }
  });
});

initDatabase().then(() => {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
  });
});