import { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useCamera } from "../../hooks/useCamera";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { permission, requestPermission, openSettings, pickFromGallery } =
    useCamera();
  const [flash, setFlash] = useState(false);

  if (permission === "undetermined") {
    return (
      <EmptyState
        title="ACCESO A CÁMARA"
        subtitle="Necesitamos tu cámara para fotografiar la barra de pesas"
        actionLabel="PERMITIR CÁMARA"
        onAction={requestPermission}
      />
    );
  }

  if (permission === "denied") {
    return (
      <View style={styles.permissionContainer}>
        <EmptyState
          title="CÁMARA NO DISPONIBLE"
          subtitle="Habilita el acceso a la cámara desde Configuración"
          actionLabel="ABRIR CONFIGURACIÓN"
          onAction={openSettings}
        />
        <View style={styles.backContainer}>
          <Button title="VOLVER" onPress={() => router.back()} variant="secondary" />
        </View>
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
      />

      <View style={styles.overlay}>
        {/* Back */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.xLine1} />
          <View style={styles.xLine2} />
        </Pressable>

        {/* Guide */}
        <View style={styles.guide}>
          <View style={styles.guideLine} />
          <Text style={styles.guideText}>ALINEA LA BARRA</Text>
          <View style={styles.guideLine} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Gallery */}
          <Pressable style={styles.controlButton} onPress={handleGallery}>
            <View style={styles.gridContainer}>
              <View style={[styles.gridDot, { top: 0, left: 0 }]} />
              <View style={[styles.gridDot, { top: 0, right: 0 }]} />
              <View style={[styles.gridDot, { bottom: 0, left: 0 }]} />
              <View style={[styles.gridDot, { bottom: 0, right: 0 }]} />
            </View>
          </Pressable>

          {/* Capture */}
          <Pressable
            style={({ pressed }) => [
              styles.captureButton,
              pressed && styles.capturePressed,
            ]}
            onPress={takePicture}
          >
            <View style={styles.captureInner} />
          </Pressable>

          {/* Flash */}
          <Pressable
            style={[styles.controlButton, flash && styles.controlActive]}
            onPress={() => setFlash(!flash)}
          >
            <View style={styles.diamond} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: Layout.spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  permissionContainer: { flex: 1, backgroundColor: Colors.background },
  backContainer: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  xLine1: {
    position: "absolute",
    width: 16,
    height: 2,
    backgroundColor: Colors.accent,
    transform: [{ rotate: "45deg" }],
  },
  xLine2: {
    position: "absolute",
    width: 16,
    height: 2,
    backgroundColor: Colors.accent,
    transform: [{ rotate: "-45deg" }],
  },
  guide: { alignItems: "center", gap: 8 },
  guideLine: {
    width: "75%",
    height: 1,
    backgroundColor: Colors.accent,
    opacity: 0.5,
  },
  guideText: {
    ...Typography.sectionLabel,
    color: "rgba(200,168,78,0.7)",
    fontSize: 11,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  gridContainer: { width: 16, height: 16 },
  gridDot: {
    position: "absolute",
    width: 5,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  diamond: {
    width: 10,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    transform: [{ rotate: "45deg" }],
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 3,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  capturePressed: {
    transform: [{ scale: 0.93 }],
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: Layout.borderRadius.sharp,
    backgroundColor: Colors.accent,
  },
});
