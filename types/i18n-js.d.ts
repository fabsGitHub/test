declare module 'i18n-js' {
  export class I18n {
    constructor(translations: Record<string, any>);
    locale: string;
    t(key: string, options?: Record<string, any>): string;
  }
} 