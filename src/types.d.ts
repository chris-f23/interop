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

  write(raw: TRawMessage): Promise<TTransformedResponse>;
}
