import { v4 as generateId } from "uuid";

export type SourceConnectorBaseConfig<TRawMessage, TTransformedMessage> = {
  /**
   * @param rawMessage - The raw message obtained after reading from the source.
   * @returns {TRawMessage} - The filtered raw message.
   */
  filter?: (rawMessage: TRawMessage) => TRawMessage;

  /**
   * @param rawMessage - The raw message obtained after reading from the source.
   * @returns {TTransformedMessage} - The transformed message.
   */
  transformer: (rawMessage: TRawMessage) => TTransformedMessage;
};

export abstract class SourceConnector<TRawMessage, TTransformedMessage> {
  public readonly id: string = generateId();

  ready = false;

  constructor(
    public readonly baseConfig: SourceConnectorBaseConfig<
      TRawMessage,
      TTransformedMessage
    >
  ) {}

  async read(
    onNewMessage: (message: TTransformedMessage) => void
  ): Promise<void> {
    if (this.ready === false) {
      throw new Error("Reader has not been initialized");
    }

    await this._read(onNewMessage);
  }

  async init(
    onNewMessage: (message: TTransformedMessage) => void
  ): Promise<void> {
    if (this.ready === true) {
      return;
    }
    this.ready = true;
    await this._init(onNewMessage);
  }

  async halt(): Promise<void> {
    if (this.ready === false) {
      return;
    }
    this.ready = false;
    await this._halt();
  }

  protected abstract _init(
    onNewMessage: (message: TTransformedMessage) => void
  ): Promise<void>;

  protected abstract _read(
    onNewMessage: (message: TTransformedMessage) => void
  ): Promise<void>;

  protected abstract _halt(): Promise<void>;
}
