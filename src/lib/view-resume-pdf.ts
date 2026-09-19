import { Platform } from 'react-native';
import * as Print from 'expo-print';

/** Native print/PDF sheet. Web should render the HTML in-app instead of a pop-up. */
export async function printResumePdf(html: string) {
  await Print.printAsync({ html });
}

export function canPrintInPlace() {
  return Platform.OS !== 'web';
}
