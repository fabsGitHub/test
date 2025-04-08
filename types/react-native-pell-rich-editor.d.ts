declare module 'react-native-pell-rich-editor' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface RichEditorProps {
    ref?: any;
    initialContentHTML?: string;
    placeholder?: string;
    onChange?: (text: string) => void;
    style?: ViewStyle;
    editorStyle?: ViewStyle & {
      color?: string;
      placeholderColor?: string;
    };
    disabled?: boolean;
    containerStyle?: ViewStyle;
    initialHeight?: number;
  }

  export interface RichToolbarProps {
    editor?: any;
    actions?: Array<string | Array<string | any>>;
    onPressAddImage?: () => void;
    selectedButtonStyle?: ViewStyle;
    iconTint?: string;
    selectedIconTint?: string;
    disabled?: boolean;
    style?: ViewStyle;
  }

  export const actions: {
    heading1: string | any[];
    heading2: string | any[];
    insertBulletsList: string | any[];
    insertOrderedList: string | any[];
    alignLeft: string | any[];
    alignCenter: string | any[];
    alignRight: string | any[];
    undo: string | any[];
    redo: string | any[];
    setBold: string;
    setItalic: string;
    setUnderline: string;
    setStrikethrough: string;
    setTextColor: string;
    setBackgroundColor: string;
    setTextAlign: string;
    setBulletList: string;
    setOrderedList: string;
    setIndent: string;
    setHeading: string;
    setQuote: string;
    insertImage: string;
    insertLink: string;
    setCode: string;
    removeFormat: string;
  };

  export const RichEditor: ComponentType<RichEditorProps>;
  export const RichToolbar: ComponentType<RichToolbarProps>;
} 