import { v4 as generateId } from "uuid";

export type DestinationConnectorBaseConfig<
  TRawMessage,
  TTransformedMessage,
  TRawResponse,
  TTransformedResponse
> = {
  /**
   * @param rawMessage - The raw message received.
   * @returns {TRawMessage} - The filtered raw message.
   */
  filter?: (rawMessage: TRawMessage) => TRawMessage;

  /**
   * @param rawMessage - The raw message obtained after reading from the source.
   * @returns {TTransformedMessage} - The transformed message.
   */
  transformer: (rawMessage: TRawMessage) => TTransformedMessage;

  /**
   * @param rawResponse - The raw response received from the destination.
   * @returns {TRawResponse} - The filtered raw response.
   */
  responseTransformer: (rawResponse: TRawResponse) => TTransformedResponse;
};

export abstract class DestinationConnector<
  TRawMessage,
  TTransformedMessage,
  TRawResponse,
  TTransformedResponse
> {
  public readonly id: string = generateId();

  ready = false;

  constructor(
    public readonly baseConfig: DestinationConnectorBaseConfig<
      TRawMessage,
      TTransformedMessage,
      TRawResponse,
      TTransformedResponse
    >
  ) {}

  async write(rawMessage: TRawMessage): Promise<TTransformedResponse> {
    if (this.ready === false) {
      throw new Error("Writer has not been initialized");
    }
    const result = await this._write(rawMessage);
    return result;
  }

  async init(): Promise<void> {
    if (this.ready === true) {
      return;
    }
    this.ready = true;
    await this._init();
  }

  async halt(): Promise<void> {
    if (this.ready === false) {
      return;
    }
    this.ready = false;
    await this._halt();
  }

  protected abstract _init(): Promise<void>;

  protected abstract _write(
    rawMessage: TRawMessage
  ): Promise<TTransformedResponse>;

  protected abstract _halt(): Promise<void>;
}
