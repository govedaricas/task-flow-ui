import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'

const API_BASE = import.meta.env.VITE_API_BASE

class SignalRService {
  constructor() {
    this.connection = null
    this.isConnected = false
    this.listeners = new Map()
  }

  async startConnection() {
    if (!localStorage.getItem('token')) return

    this.connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/task`, {
        accessTokenFactory: () => localStorage.getItem('token'),
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    // Keepalive da Render proxy ne ubije konekciju
    this.connection.keepAliveIntervalInMilliseconds = 15000
    this.connection.serverTimeoutInMilliseconds = 60000

    this.connection.onreconnecting(() => { this.isConnected = false })
    this.connection.onreconnected(() => { this.isConnected = true })
    this.connection.onclose(() => { this.isConnected = false })

    await this.connection.start()
    this.isConnected = true

    for (const [event, callback] of this.listeners) {
      this.connection.on(event, callback)
    }
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop()
      this.isConnected = false
    }
  }

  on(event, callback) {
    this.listeners.set(event, callback)

    if (this.connection && this.isConnected) {
      this.connection.on(event, callback)
    }
  }

  off(event) {
    if (this.listeners.has(event)) {
      this.listeners.delete(event)
    }

    if (this.connection && this.isConnected) {
      this.connection.off(event)
    }
  }

}

const signalRService = new SignalRService()
export default signalRService