declare namespace JSX {
  interface IntrinsicElements {
    'df-messenger': {
      intent?: string;
      'chat-title'?: string;
      'agent-id'?: string;
      'language-code'?: string;
      children?: React.ReactNode;
    };
  }
}