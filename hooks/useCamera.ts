import { useState, useEffect } from "react";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";

export function useCamera() {
  const [permission, setPermission] = useState<"granted" | "denied" | "undetermined">("undetermined");

  useEffect(() => {
    Camera.getCameraPermissionsAsync().then(({ status }) => {
      setPermission(status as "granted" | "denied" | "undetermined");
    });
  }, []);

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setPermission(status as "granted" | "denied" | "undetermined");
    return status === "granted";
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  const pickFromGallery = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  };

  return { permission, requestPermission, openSettings, pickFromGallery };
}
