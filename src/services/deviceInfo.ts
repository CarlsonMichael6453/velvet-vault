import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type DeviceSnapshot = {
  version: string;
  model: string;
  os: string;
};

export function deviceSnapshot(): DeviceSnapshot {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const model = Device.modelName ?? (Platform.OS === 'web' ? 'Web browser' : 'Unknown device');
  const osName = Device.osName ?? Platform.OS;
  const osVersion = Device.osVersion ?? (Platform.OS === 'web' ? '' : String(Platform.Version));
  return { version, model, os: [osName, osVersion].filter(Boolean).join(' ') };
}
