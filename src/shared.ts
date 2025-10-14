export class Message<TContent> {
  constructor(
    public readonly message: TContent,
    public from: string,
    public to: string
  ) {}
}
