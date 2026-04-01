import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

const MAX_BASE64_LENGTH = 500_000; // ~375KB imagen real

export async function compressImage(uri: string): Promise<string> {
  // Primera pasada: resize a 1024px ancho
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Verificar tamaño del base64
  let base64 = await FileSystem.readAsStringAsync(result.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Si sigue muy grande, comprimir mas
  if (base64.length > MAX_BASE64_LENGTH) {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 768 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  // Ultimo recurso
  if (base64.length > MAX_BASE64_LENGTH) {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512 } }],
      { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  return result.uri;
}

export async function imageToBase64(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
