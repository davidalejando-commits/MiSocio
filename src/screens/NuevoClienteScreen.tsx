// src/screens/NuevoClienteScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { crearCliente } from '../database/clientesDB';

export default function NuevoClienteScreen({ navigation }: any) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const seleccionarFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setFotoUri(result.assets[0].uri);
    }
  };

  const guardarCliente = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    try {
      crearCliente({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        foto_uri: fotoUri,
        limite_credito: parseFloat(limiteCredito) || 0,
        saldo_deuda: 0,
      });
      Alert.alert('Éxito', 'Cliente guardado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A56FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Cliente</Text>
        <View style={styles.avatar}>
          <Ionicons name="person" size={16} color="#1A56FF" />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Sección info general */}
        <View style={styles.seccion}>
          <View style={styles.seccionTitleRow}>
            <Ionicons name="person-add-outline" size={18} color="#1A56FF" />
            <Text style={styles.seccionTitle}>Información General</Text>
          </View>

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Juan Pérez"
            placeholderTextColor="#bbb"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.inputFlex}
              placeholder="+57 123 456 7890"
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
            />
          </View>

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Calle, Número, Barrio, Ciudad..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={3}
            value={direccion}
            onChangeText={setDireccion}
          />
        </View>

        {/* Sección finanzas */}
        <View style={styles.seccion}>
          <View style={styles.seccionTitleRow}>
            <Ionicons name="wallet-outline" size={18} color="#1A56FF" />
            <Text style={styles.seccionTitle}>Finanzas</Text>
          </View>

          <Text style={styles.label}>Límite de crédito inicial</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.inputFlex}
              placeholder="0.00"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
              value={limiteCredito}
              onChangeText={setLimiteCredito}
            />
          </View>
        </View>

        {/* Sección foto */}
        <View style={styles.seccion}>
          <View style={styles.seccionTitleRow}>
            <Ionicons name="camera-outline" size={18} color="#1A56FF" />
            <Text style={styles.seccionTitle}>Foto del Cliente o Negocio</Text>
          </View>

          <TouchableOpacity style={styles.fotoWrap} onPress={seleccionarFoto}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#aaa" />
                <Text style={styles.fotoPlaceholderText}>Toca para subir una foto</Text>
                <Text style={styles.fotoPlaceholderSub}>JPG o PNG, máx 5MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Botón guardar */}
      <View style={styles.footerBtn}>
        <TouchableOpacity
          style={[styles.guardarBtn, guardando && { opacity: 0.7 }]}
          onPress={guardarCliente}
          disabled={guardando}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.guardarBtnText}>
            {guardando ? 'Guardando...' : 'Guardar Cliente'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },

  seccion: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  seccionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  seccionTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', marginBottom: 14 },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, marginBottom: 14, height: 48 },
  inputIcon: { marginRight: 8 },
  inputFlex: { flex: 1, fontSize: 15, color: '#111' },
  inputPrefix: { fontSize: 16, fontWeight: '700', color: '#1A56FF', marginRight: 6 },

  fotoWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  fotoPreview: { width: '100%', height: 180, resizeMode: 'cover' },
  fotoPlaceholder: { height: 140, alignItems: 'center', justifyContent: 'center', gap: 6 },
  fotoPlaceholderText: { fontSize: 14, color: '#888', fontWeight: '500' },
  fotoPlaceholderSub: { fontSize: 12, color: '#bbb' },

  footerBtn: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  guardarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A56FF', borderRadius: 14, padding: 16, gap: 8 },
  guardarBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});