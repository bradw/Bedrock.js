import Packet from "@/Packet";
import Protocol from "@/Protocol";
import EncapsulatedPacket from "./EncapsulatedPacket";
import { BinaryStream } from "@/utils";
import BitFlag from "@/utils/BitFlag";

export default class Datagram extends Packet {

  public packets: EncapsulatedPacket[]

  public sequenceNumber: number = 0

  public packetPair: boolean = false
  public continuousSend: boolean = false
  public needsBAndAs: boolean = false

  public headerFlags: number = 0

  constructor(packets: EncapsulatedPacket[] = [], id: number = Protocol.DATA_PACKET_4) {
    super(id)

    this.packets = packets
  }

  protected encodeHeader() {
    // if(this.packetPair) this.headerFlags |= BitFlag.PacketPair
    // if(this.continuousSend) this.headerFlags |= BitFlag.ContinuousSend
    // if(this.needsBAndAs) this.headerFlags |= BitFlag.NeedsBAndS

    this.getStream().writeByte(BitFlag.Valid | this.headerFlags)
  }

  protected encodeBody() {
    this.getStream().writeLTriad(this.sequenceNumber)
    this.packets.forEach(packet => this.getStream().append(packet.toBinary()))
  }

  static fromBinary(stream: BinaryStream): Datagram {
    const flags = stream.readByte()
    const datagram = new Datagram([], flags)

    datagram.packetPair = (flags & BitFlag.PacketPair) > 0;
    datagram.continuousSend = (flags & BitFlag.ContinuousSend) > 0;
    datagram.needsBAndAs = (flags & BitFlag.NeedsBAndS) > 0;

    datagram.sequenceNumber = stream.readLTriad()

    while (!stream.feof()) {
      let packet = EncapsulatedPacket.fromBinary(stream);

      if (!packet.getStream().length) {
        break;
      }

      datagram.packets.push(packet);
    }

    return datagram
  }

}