import { randomUUID } from 'node:crypto'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT) || 8080

const types = ['info', 'warning', 'error', 'success']
const samples = [
  'Deployment to **production** completed successfully.',
  '`API request` to /v1/users returned 500.',
  'High memory usage on `worker-3` — *please investigate*.',
  'New customer signed up: **Acme Inc.**',
  'Background job finished in 2.3s.',
  'Rate limit warning for `client_42`.',
]

const pick = (xs) => xs[Math.floor(Math.random() * xs.length)]

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  console.log(`[ws] client connected (${wss.clients.size} total)`)

  const interval = setInterval(() => {
    ws.send(
      JSON.stringify({
        id: randomUUID(),
        type: pick(types),
        text: pick(samples),
        timestamp: Date.now(),
      }),
    )
  }, 2000)

  ws.on('message', (data) => {
    ws.send(
      JSON.stringify({
        id: randomUUID(),
        type: 'info',
        text: `You said: ${data.toString()}`,
        timestamp: Date.now(),
      }),
    )
  })

  ws.on('close', () => {
    clearInterval(interval)
    console.log(`[ws] client disconnected (${wss.clients.size} remaining)`)
  })
})

console.log(`[ws] listening on ws://localhost:${PORT}`)
