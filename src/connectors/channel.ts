import { v4 as generateId } from "uuid";
import { DestinationConnector } from "./destination-connector";
import { SourceConnector } from "./source-connector";
import mitt from "mitt";

type ChannelConfig<TMessage> = {
  name: string;
  source: SourceConnector<any, TMessage>;
  destinations: Array<DestinationConnector<TMessage, any, any, any>>;
};

export class Channel<TMessage> {
  public readonly id: string = generateId();

  emitter = mitt<{
    messageReceived: TMessage;
    messageSent: { message: TMessage; destinationIds: string[] };
  }>();

  constructor(public readonly config: ChannelConfig<TMessage>) {
    this.emitter.on("messageReceived", this.handleReceiveMessage.bind(this));
  }

  private receiveMessage(message: TMessage): void {
    this.emitter.emit("messageReceived", message);
  }

  private async handleReceiveMessage(message: TMessage): Promise<void> {
    await this.processMessage(message);
  }

  public async init(): Promise<void> {
    for (const destination of this.config.destinations) {
      await destination.init();
    }

    await this.config.source.init(this.receiveMessage.bind(this));
  }

  public async processMessage(message: TMessage): Promise<void> {
    const destinationsIds: string[] = [];

    for (const destination of this.config.destinations) {
      try {
        await destination.write(message);
        destinationsIds.push(destination.id);
      } catch (error) {
        console.error(error);
      }
    }

    this.emitter.emit("messageSent", {
      message: message,
      destinationIds: destinationsIds,
    });
  }

  public async halt(): Promise<void> {
    await this.config.source.halt();
    for (const destination of this.config.destinations) {
      await destination.halt();
    }
  }
}
