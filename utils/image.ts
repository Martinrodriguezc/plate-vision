import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export async function compressImage(uri: string): Promise<string> {
  let quality = 0.8;
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Reducir calidad si supera 1MB
  const info = await FileSystem.getInfoAsync(result.uri);
  if (info.exists && info.size && info.size > MAX_SIZE_BYTES) {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  return result.uri;
}

export async function imageToBase64(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
