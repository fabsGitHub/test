declare module 'react-quill' {
  import { ComponentType } from 'react';

  interface ReactQuillProps {
    value?: string;
    onChange?: (content: string) => void;
    modules?: Record<string, any>;
    formats?: string[];
    placeholder?: string;
    readOnly?: boolean;
    theme?: string;
  }

  const ReactQuill: ComponentType<ReactQuillProps>;
  export default ReactQuill;
} 