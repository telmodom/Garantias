import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { Camera, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { processInvoiceImage } from '../../lib/ocr';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';

export default function AddInvoiceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isQRMode, setIsQRMode] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  const cameraRef = useRef<Camera>(null);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-center mb-4 text-lg">Precisamos da tua permissão para usar a câmara</Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanned || !isQRMode) return;
    setScanned(true);
    Alert.alert("QR Code Detetado", `Dados: ${data}`);
    // Here you would process the QR code data
  };

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      setProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        setCapturedImage(photo.uri);

        // Process with OCR
        const result = await processInvoiceImage(photo.uri);
        setOcrResult(result);

      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Erro", "Falha ao capturar a imagem.");
      } finally {
        setProcessing(false);
      }
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setScanned(false);
  };

  const saveInvoice = () => {
    // Here you would save the invoice to Supabase
    Alert.alert("Sucesso", "Fatura guardada com sucesso!", [
      { text: "OK", onPress: () => {
        resetCapture();
        router.push('/');
      }}
    ]);
  };

  if (capturedImage && ocrResult) {
    return (
      <View className="flex-1 bg-gray-50 pt-10">
        <ScrollView className="flex-1 px-4">
          <Text className="text-2xl font-bold mb-4 text-gray-900">Confirmar Fatura</Text>

          <Image source={{ uri: capturedImage }} className="w-full h-64 rounded-lg mb-4 bg-gray-200" resizeMode="contain" />

          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-gray-500 text-sm">Loja</Text>
            <Text className="text-lg font-semibold">{ocrResult.store_name}</Text>

            <Text className="text-gray-500 text-sm mt-3">Data da Compra</Text>
            <Text className="text-lg font-semibold">{ocrResult.purchase_date}</Text>
          </View>

          <Text className="text-lg font-bold mb-2 text-gray-800">Produtos Detetados</Text>
          <View className="bg-white rounded-lg shadow-sm mb-20">
            {ocrResult.items.map((item: string, index: number) => (
              <View key={index} className="p-4 border-b border-gray-100 flex-row items-center justify-between">
                <Text className="text-gray-800 flex-1 mr-2">{item}</Text>
                <TouchableOpacity className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 text-xs font-medium">3 Anos</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex-row justify-between pb-8">
          <TouchableOpacity
            className="flex-1 bg-gray-200 py-3 rounded-lg mr-2 items-center"
            onPress={resetCapture}
          >
            <Text className="text-gray-800 font-semibold">Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-blue-600 py-3 rounded-lg ml-2 items-center"
            onPress={saveInvoice}
          >
            <Text className="text-white font-semibold">Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={cameraType}
        onBarCodeScanned={isQRMode && !scanned ? handleBarCodeScanned : undefined}
      >
        <View className="flex-1 bg-transparent justify-between p-6">
          {/* Top Bar: Controls */}
          <View className="flex-row justify-between items-center mt-10">
            <TouchableOpacity onPress={() => router.back()} className="p-2 bg-black/40 rounded-full">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <View className="flex-row bg-black/40 rounded-full p-1">
              <TouchableOpacity
                className={`px-4 py-1 rounded-full ${!isQRMode ? 'bg-white' : ''}`}
                onPress={() => setIsQRMode(false)}
              >
                <Text className={`${!isQRMode ? 'text-black' : 'text-white'} font-medium text-xs`}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-1 rounded-full ${isQRMode ? 'bg-white' : ''}`}
                onPress={() => setIsQRMode(true)}
              >
                <Text className={`${isQRMode ? 'text-black' : 'text-white'} font-medium text-xs`}>QR Code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity className="p-2 bg-black/40 rounded-full">
              <Ionicons name="flash-off" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Center: Guidelines */}
          <View className="flex-1 justify-center items-center">
            {isQRMode ? (
              <View className="w-64 h-64 border-2 border-white/50 rounded-lg" />
            ) : (
              <View className="w-full h-3/4 border border-white/30 border-dashed rounded-lg" />
            )}
          </View>

          {/* Bottom: Capture Button */}
          <View className="items-center mb-6">
            {!isQRMode && (
              <TouchableOpacity
                onPress={takePicture}
                disabled={processing}
                className="w-20 h-20 bg-white rounded-full justify-center items-center border-4 border-gray-300"
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <View className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                )}
              </TouchableOpacity>
            )}
            {isQRMode && (
               <Text className="text-white text-center">Aponte para o QR Code</Text>
            )}
          </View>
        </View>
      </Camera>
    </View>
  );
}
