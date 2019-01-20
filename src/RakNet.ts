import Server from "@/Server"
import { BinaryStream, Address } from "@/utils"
import Protocol from "@/packets/Protocol"
import UnconnectedPing from "@/packets/UnconnectedPing"
import UnconnectedPong from "@/packets/UnconnectedPong"
import IncompatibleProtocol from "@/packets/IncompatibleProtocol"
import OpenConnectionRequestOne from "@/packets/OpenConnectionRequestOne"
import OpenConnectionReplyOne from "@/packets/OpenConnectionReplyOne"
import OpenConnectionRequestTwo from "@/packets/OpenConnectionRequestTwo"
import OpenConnectionReplyTwo from "@/packets/OpenConnectionReplyTwo"
import Client from "@/Client"
import Logger from "@/utils/Logger"

export default class RakNet {

  private server: Server

  private logger: Logger

  constructor(server: Server) {
    this.server = server

    this.logger = new Logger('RakNet')
  }

  handleUnconnectedPacket(stream: BinaryStream, recipient: Address) {
    const id = stream.buffer[0]

    switch (id) {
      case Protocol.UNCONNECTED_PING:
        this.handleUnconnectedPing(stream, recipient)
        break
      case Protocol.OPEN_CONNECTION_REQUEST_1:
        this.handleOpenConnectionRequestOne(stream, recipient)
        break
      case Protocol.OPEN_CONNECTION_REQUEST_2:
        this.handleOpenConnectionRequestTwo(stream, recipient)
        break
      default:
        this.logger.error('Unimplemented packet:', id)
    }
  }

  handleUnconnectedPing(stream: BinaryStream, recipient: Address) {
    const ping = new UnconnectedPing(stream)
    const pong = new UnconnectedPong(ping.pingId, this.server.getName(), this.server.getMaxPlayers())
    this.server.send(pong.encode(), recipient)
  }

  handleOpenConnectionRequestOne(stream: BinaryStream, recipient: Address) {
    const req = new OpenConnectionRequestOne(stream)

    if (req.protocol !== Protocol.PROTOCOL_VERSION) {
      const packet = new IncompatibleProtocol()
      this.server.send(packet.encode(), recipient)
    } else {
      const packet = new OpenConnectionReplyOne(req.mtuSize)
      this.server.send(packet.encode(), recipient)
    }
  }

  handleOpenConnectionRequestTwo(stream: BinaryStream, recipient: Address) {
    const req = new OpenConnectionRequestTwo(stream)

    const packet = new OpenConnectionReplyTwo(req.port, req.mtuSize)
    if(!this.server.hasClient(recipient)) {
      const client = new Client(recipient, req.mtuSize, this.server)
      this.server.addClient(client)

      this.logger.debug('Created client for', `${client.address.ip}:${client.address.port}`)

      this.server.send(packet.encode(), recipient)
    }
  }

}