interface ISourceConnector<TRawMessage, TTransformedMessage> {
  readonly config: {
    transformer: (raw: TRawMessage) => TTransformedMessage;
  };
  start(): Promise<void>;
  read(): Promise<TTransformedMessage>;
}

interface IDestinationConnector<
  TRawMessage,
  TTransformedMessage,
  TRawResponse,
  TTransformedResponse
> {
  readonly config: {
    transformer: (raw: TRawMessage) => TTransformedMessage;
    responseTransformer: (raw: TRawResponse) => TTransformedResponse;
  };
  start(): Promise<void>;

  send(raw: TRawMessage): Promise<TTransformedResponse>;
}
