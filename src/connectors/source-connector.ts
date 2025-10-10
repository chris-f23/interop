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
  public readonly id = generateId();

  ready = false;

  constructor(
    public readonly baseConfig: SourceConnectorBaseConfig<
      TRawMessage,
      TTransformedMessage
    >
  ) {}

  async read(): Promise<TTransformedMessage> {
    if (this.ready === false) {
      throw new Error("Reader has not been initialized");
    }
    const result = await this.onRead();
    return result;
  }

  async init(): Promise<void> {
    if (this.ready === true) {
      return;
    }
    await this.onInit();
    this.ready = true;
  }

  protected abstract onInit(): Promise<void>;

  protected abstract onRead(): Promise<TTransformedMessage>;
}
