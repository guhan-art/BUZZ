/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { Colors } from '../constants/theme';
import { useColorScheme } from './use-color-scheme';

type Theme = 'light' | 'dark';
type ColorKey = 'text' | 'background';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey
) {
  const theme = (useColorScheme() as Theme) ?? 'light';
  const colorFromProps = props[theme];
  return colorFromProps ?? Colors[theme][colorName];
}