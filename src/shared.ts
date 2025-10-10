export class MessageEnvelope<TMessage> {
  constructor(
    public readonly message: TMessage,
    public from: string,
    public to: string
  ) {}
}
