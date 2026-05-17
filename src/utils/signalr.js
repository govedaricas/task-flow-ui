import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

const API_BASE = import.meta.env.VITE_API_BASE

class SignalRService {
  constructor() {
    this.connection = null
    this.isConnected = false
    this.listeners = new Map()
  }

  async startConnection() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, skipping SignalR connection')
        return
      }

      this.connection = new HubConnectionBuilder()
        .withUrl(`${API_BASE}/hubs/task`, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build()

      // Keepalive da Render proxy ne ubije konekciju
      this.connection.keepAliveIntervalInMilliseconds = 15000
      this.connection.serverTimeoutInMilliseconds = 60000

      this.connection.onreconnecting(() => {
        this.isConnected = false
        console.log('SignalR reconnecting...')
      })

      this.connection.onreconnected(() => {
        this.isConnected = true
        console.log('SignalR reconnected:', this.connection.connectionId)
      })

      this.connection.onclose(() => {
        this.isConnected = false
        console.log('SignalR connection closed')
      })

      await this.connection.start()
      this.isConnected = true
      console.log('SignalR connected:', this.connection.connectionId)

      for (const [event, callback] of this.listeners) {
        this.connection.on(event, callback)
      }

    } catch (error) {
      console.error('SignalR connection failed:', error)
      this.isConnected = false
      throw error
    }
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop()
      this.isConnected = false
      console.log('SignalR connection stopped')
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

  async testConnection() {
    try {
      console.log('Testing backend connectivity...')
      const response = await fetch(`${API_BASE}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        console.log('Backend is reachable and responding')
        return true
      } else {
        console.error('Backend responded with error:', response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error('Backend is not reachable:', error)
      return false
    }
  }
}

const signalRService = new SignalRService()
export default signalRService