interface ReaderConfig {
  polling: {
    scheduleType: "interval";
    intervalInSeconds: number;
  };
}

interface Envelope<TMessage> {
  id: string;
  message: TMessage;
  fromConnectorId: string;
}
