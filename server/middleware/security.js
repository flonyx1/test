import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requestTracker = new Map();
const ipBlacklist = new Set();
const suspiciousIPs = new Map();

const DDOS_CONFIG = {
  maxRequestsPerMinute: 60,
  maxRequestsPerSecond: 10,
  blockDuration: 15 * 60 * 1000,
  suspiciousThreshold: 100,
  cleanupInterval: 5 * 60 * 1000,
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestTracker.entries()) {
    if (now - data.lastRequest > 60000) {
      requestTracker.delete(ip);
    }
  }
  
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (now - data.firstSeen > DDOS_CONFIG.blockDuration) {
      suspiciousIPs.delete(ip);
    }
  }
}, DDOS_CONFIG.cleanupInterval);

export function getRealIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip ||
         '127.0.0.1';
}

export function antiDDoS(req, res, next) {
  const ip = getRealIP(req);
  const now = Date.now();
  
  if (ipBlacklist.has(ip)) {
    return res.status(429).json({ 
      error: 'IP заблокирован за подозрительную активность',
      code: 'IP_BLOCKED'
    });
  }
  
  if (!requestTracker.has(ip)) {
    requestTracker.set(ip, {
      requests: [],
      lastRequest: now,
      totalRequests: 0
    });
  }
  
  const ipData = requestTracker.get(ip);
  
  ipData.requests = ipData.requests.filter(time => now - time < 60000);
  
  ipData.requests.push(now);
  ipData.lastRequest = now;
  ipData.totalRequests++;
  
  const requestsLastMinute = ipData.requests.length;
  const requestsLastSecond = ipData.requests.filter(time => now - time < 1000).length;
  
  if (requestsLastSecond > DDOS_CONFIG.maxRequestsPerSecond) {
    ipBlacklist.add(ip);
    
    setTimeout(() => {
      ipBlacklist.delete(ip);
    }, DDOS_CONFIG.blockDuration);
    
    return res.status(429).json({ 
      error: 'Слишком много запросов. IP временно заблокирован.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(DDOS_CONFIG.blockDuration / 1000)
    });
  }
  
  if (requestsLastMinute > DDOS_CONFIG.maxRequestsPerMinute) {
    if (!suspiciousIPs.has(ip)) {
      suspiciousIPs.set(ip, { firstSeen: now, warnings: 1 });
    } else {
      const suspiciousData = suspiciousIPs.get(ip);
      suspiciousData.warnings++;
      
      if (suspiciousData.warnings >= 3) {
        ipBlacklist.add(ip);
        
        setTimeout(() => {
          ipBlacklist.delete(ip);
          suspiciousIPs.delete(ip);
        }, DDOS_CONFIG.blockDuration * 2);
      }
    }
    
    return res.status(429).json({ 
      error: 'Превышен лимит запросов в минуту',
      code: 'RATE_LIMIT_MINUTE',
      retryAfter: 60
    });
  }
  
  res.set({
    'X-RateLimit-Limit': DDOS_CONFIG.maxRequestsPerMinute,
    'X-RateLimit-Remaining': Math.max(0, DDOS_CONFIG.maxRequestsPerMinute - requestsLastMinute),
    'X-RateLimit-Reset': new Date(now + 60000).toISOString()
  });
  
  next();
}

export async function checkBlockedCountries(req, res, next) {
  try {
    const ip = getRealIP(req);
    
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return next();
    }
    
    const blockedCountries = JSON.parse(
      await fs.readFile(path.join(__dirname, '../database/blocked-countries.json'), 'utf8')
    );
    
    if (blockedCountries.length === 0) {
      return next();
    }
    
    next();
    
  } catch (error) {
    next();
  }
}

export async function checkAdminIP(req, res, next) {
  try {
    const ip = getRealIP(req);
    const admins = JSON.parse(
      await fs.readFile(path.join(__dirname, '../database/admins.json'), 'utf8')
    );
    
    const isAdmin = admins.some(admin => admin.ip === ip && admin.active);
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    req.isAdmin = true;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

export function logSuspiciousActivity(ip, activity, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ip,
    activity,
    details,
    userAgent: details.userAgent || 'Unknown'
  };
  
}

export { requestTracker, ipBlacklist, suspiciousIPs, DDOS_CONFIG };