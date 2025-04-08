declare module '@react-native-community/datetimepicker' {
  import { ViewStyle } from 'react-native';

  export interface DateTimePickerEvent {
    type: string;
    nativeEvent: {
      timestamp?: number;
    };
  }

  export interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
    style?: ViewStyle;
    textColor?: string;
    testID?: string;
  }

  const DateTimePicker: React.FC<DateTimePickerProps>;
  export default DateTimePicker;
} 