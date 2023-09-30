class Laru {
  listeners: {};
  socket: WebSocket;
  messageQueue: any[] = [];
  id: any;
  constructor(url:string) {
    this.socket = new WebSocket(url);
    this.listeners = {};
  }

  connect(callback) {
    this.socket.onopen = () => {
      console.log("Conectado!");
      this.processMessageQueue();
      callback();
    };
    
    this.socket.onmessage = (msg) => {
      this.onmessage(msg);
    };

    this.socket.onclose = (event) => {
      console.log("Desconectado!", event);
    };

    this.socket.onerror = (err) => {
      console.log("Error!", err);
    };
  }

  emit(mensaje, body) {
    const data = {
      event: mensaje,
      body: body
    }
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(data);
    } else {
      this.socket.send(JSON.stringify(data));
    }
  }

  close() {
    this.socket.close();
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  onmessage(msg) {
    const data = JSON.parse(msg.data);
    if (this.listeners[data.event]) {
      this.listeners[data.event](data.body);
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      this.socket.send(JSON.stringify(this.messageQueue.shift()));
    }
  }
}

export { Laru };