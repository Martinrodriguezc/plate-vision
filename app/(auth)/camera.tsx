import { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useCamera } from "../../hooks/useCamera";
import { Colors } from "../../constants/Colors";

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { permission, requestPermission, openSettings, pickFromGallery } =
    useCamera();
  const [flash, setFlash] = useState(false);

  // Solicitar permiso al montar
  if (permission === "undetermined") {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.title}>Acceso a cámara</Text>
        <Text style={styles.subtitle}>
          Necesitamos tu cámara para fotografiar la barra de pesas
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir cámara</Text>
        </Pressable>
      </View>
    );
  }

  // Permiso denegado
  if (permission === "denied") {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>Cámara no disponible</Text>
        <Text style={styles.subtitle}>
          Habilita el acceso a la cámara desde Configuración para usar Plate
          Vision
        </Text>
        <Pressable style={styles.button} onPress={openSettings}>
          <Text style={styles.buttonText}>Abrir Configuración</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) {
      router.push({ pathname: "/(auth)/preview", params: { uri: photo.uri } });
    }
  };

  const handleGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) {
      router.push({ pathname: "/(auth)/preview", params: { uri } });
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash ? "on" : "off"}
      >
        {/* Overlay guide */}
        <View style={styles.overlay}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>

          <View style={styles.guide}>
            <View style={styles.guideLine} />
            <Text style={styles.guideText}>Alinea la barra aquí</Text>
            <View style={styles.guideLine} />
          </View>

          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={handleGallery}>
              <Text style={styles.controlEmoji}>🖼️</Text>
            </Pressable>

            <Pressable style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </Pressable>

            <Pressable
              style={styles.controlButton}
              onPress={() => setFlash(!flash)}
            >
              <Text style={styles.controlEmoji}>{flash ? "⚡" : "💡"}</Text>
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  guide: {
    alignItems: "center",
    gap: 8,
  },
  guideLine: {
    width: "80%",
    height: 2,
    backgroundColor: "rgba(108,99,255,0.6)",
    borderRadius: 1,
  },
  guideText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlEmoji: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  // Permission screens
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
