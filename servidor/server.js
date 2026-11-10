// MDG 27 · servidor online de reserva (Render): mismo protocolo que el de Cloudflare (salas con código, reenvío de mensajes)
import http from "node:http"; import { WebSocketServer } from "ws"; import crypto from "node:crypto";
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", code = () => Array.from(crypto.randomBytes(5), b => ABC[b % ABC.length]).join("");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" };
const salas = new Map();
const srv = http.createServer((req, res) => { const u = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  if (u.pathname === "/" || u.pathname === "/ping") { res.writeHead(200, CORS); return res.end(JSON.stringify({ ok: true, juego: "MDG 27", reserva: true, t: Date.now() })); }
  if (u.pathname === "/plaza") { let i = 1; while ((salas.get("PLAZA" + i) || new Set()).size >= 25 && i < 40) i++; res.writeHead(200, CORS); return res.end(JSON.stringify({ sala: "PLAZA" + i, n: (salas.get("PLAZA" + i) || new Set()).size })); }
  if (u.pathname === "/nueva") { res.writeHead(200, CORS); return res.end(JSON.stringify({ sala: code() })); }
  res.writeHead(404, CORS); res.end("{}"); });
const wss = new WebSocketServer({ noServer: true });
srv.on("upgrade", (req, sock, head) => { const u = new URL(req.url, "http://x"), m = u.pathname.match(/^\/sala\/([A-Z0-9]{4,8})$/); if (!m) return sock.destroy();
  const id = m[1], max = Math.min(30, Math.max(2, +(u.searchParams.get("max") || 2))), S = salas.get(id) || new Set(); if (S.size >= max) { sock.write("HTTP/1.1 409 Conflict\r\n\r\n"); return sock.destroy(); }
  wss.handleUpgrade(req, sock, head, ws => { salas.set(id, S); const used = new Set([...S].map(w => w.n)); let n = 0; while (used.has(n)) n++; ws.n = n; ws.name = (u.searchParams.get("nombre") || "Jugador").slice(0, 16);
    ws.send(JSON.stringify({ t: "hola", n, host: n === 0, otros: [...S].map(w => ({ n: w.n, name: w.name })) })); for (const w of S) w.send(JSON.stringify({ t: "entra", n, name: ws.name })); S.add(ws);
    ws.on("message", (data, bin) => { let msg = bin ? data : data.toString(), to = null; if (!bin && msg.length < 200 && msg.startsWith("{\"a\":")) { try { to = JSON.parse(msg).a; } catch (e) {} }
      const out = bin ? msg : msg.replace(/^\{/, "{\"de\":" + n + ","); for (const w of S) if (w !== ws && w.readyState === 1 && (to == null || w.n === to)) w.send(out); });
    ws.on("close", () => { S.delete(ws); for (const w of S) w.send(JSON.stringify({ t: "sale", n })); if (!S.size) salas.delete(id); }); }); });
srv.listen(process.env.PORT || 10000, () => console.log("MDG 27 online (reserva) en el puerto", process.env.PORT || 10000));
