// src/screens/NuevoProductoScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { crearProducto, actualizarProducto } from '../database/inventarioDB';
import { Producto } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

const CATEGORIAS = ['Electrónica', 'Hogar', 'Ropa', 'Alimentos', 'Otro'];

export default function NuevoProductoScreen({ navigation, route }: any) {
  const productoEditar: Producto | undefined = route?.params?.producto;

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState(0);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (productoEditar) {
      setNombre(productoEditar.nombre);
      setCategoria(productoEditar.categoria);
      setPrecio(String(productoEditar.precio));
      setStock(productoEditar.stock);
      setFotoUri(productoEditar.foto_uri ?? null);
    }
  }, []);
  const seleccionarFoto = async () => {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (!result.canceled) {
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() ?? 'jpg';
      const nombreArchivo = `producto_${Date.now()}.${ext}`;
      const destino = `${FileSystem.documentDirectory}${nombreArchivo}`;

      await FileSystem.copyAsync({ from: uri, to: destino });

      if (fotoUri && fotoUri.includes('producto_')) {
        await FileSystem.deleteAsync(fotoUri, { idempotent: true });
      }

      setFotoUri(destino);
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la imagen');
    }
  }
};

  const guardarProducto = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }
    if (!precio || isNaN(parseFloat(precio))) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }
    setGuardando(true);
    try {
      if (productoEditar) {
        actualizarProducto(productoEditar.id, {
          nombre: nombre.trim(),
          categoria,
          precio: parseFloat(precio),
          stock,
          foto_uri: fotoUri,
        });
        Alert.alert('Éxito', 'Producto actualizado', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        crearProducto({
          nombre: nombre.trim(),
          categoria,
          precio: parseFloat(precio),
          stock,
          foto_uri: fotoUri,
        });
        Alert.alert('Éxito', 'Producto publicado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A56FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {productoEditar ? 'Editar Producto' : 'Nuevo Producto'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Foto */}
        <TouchableOpacity style={styles.fotoWrap} onPress={seleccionarFoto}>
          {fotoUri ? (
            <>
              <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
              <View style={styles.fotoEditBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
                <Text style={styles.fotoEditText}>Cambiar foto</Text>
              </View>
            </>
          ) : (
            <View style={styles.fotoPlaceholder}>
              <View style={styles.fotoIconCircle}>
                <Ionicons name="camera" size={28} color="#fff" />
              </View>
              <Text style={styles.fotoTexto}>Capturar Foto del Producto</Text>
              <Text style={styles.fotoSub}>Imagen clara, fondo neutro sugerido</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Nombre */}
        <Text style={styles.label}>Nombre del producto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Taladro Percutor 18V"
          placeholderTextColor="#bbb"
          value={nombre}
          onChangeText={setNombre}
        />

        {/* Categoría */}
        <Text style={styles.label}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
          {CATEGORIAS.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoriaBadge, categoria === cat && styles.categoriaBadgeActiva]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[styles.categoriaText, categoria === cat && styles.categoriaTextActiva]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Precio */}
        <Text style={styles.label}>Precio de venta</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputPrefix}>$</Text>
          <TextInput
            style={styles.inputFlex}
            placeholder="0.00"
            placeholderTextColor="#bbb"
            keyboardType="decimal-pad"
            value={precio}
            onChangeText={setPrecio}
          />
        </View>

        {/* Stock */}
        <Text style={styles.label}>Stock inicial</Text>
        <View style={styles.stockRow}>
          <TouchableOpacity
            style={styles.stockBtn}
            onPress={() => setStock(Math.max(0, stock - 1))}
          >
            <Ionicons name="remove" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.stockNum}>{stock}</Text>
          <TouchableOpacity
            style={styles.stockBtn}
            onPress={() => setStock(stock + 1)}
          >
            <Ionicons name="add" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Consejo */}
        <View style={styles.consejoCard}>
          <View style={styles.consejoIcon}>
            <Ionicons name="bulb" size={18} color="#2D6A00" />
          </View>
          <View style={styles.consejoInfo}>
            <Text style={styles.consejoTitle}>Consejo de inventario</Text>
            <Text style={styles.consejoText}>
              Asegúrate de que el precio cubra tus costos y margen de beneficio. Puedes editar el stock más tarde desde el panel de Inventario.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footerBtn}>
        <TouchableOpacity
          style={[styles.publicarBtn, guardando && { opacity: 0.7 }]}
          onPress={guardarProducto}
          disabled={guardando}
        >
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.publicarBtnText}>
            {guardando ? 'Guardando...' : productoEditar ? 'Actualizar Producto' : 'Publicar Producto'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },

  fotoWrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', marginVertical: 16, backgroundColor: '#F8F8F8' },
  fotoPreview: { width: '100%', height: 200, resizeMode: 'cover' },
  fotoEditBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
  fotoEditText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fotoPlaceholder: { height: 180, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fotoIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1A56FF', alignItems: 'center', justifyContent: 'center' },
  fotoTexto: { fontSize: 15, fontWeight: '600', color: '#333' },
  fotoSub: { fontSize: 12, color: '#aaa' },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#111', marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, height: 52, borderWidth: 1, borderColor: '#F0F0F0' },
  inputPrefix: { fontSize: 18, fontWeight: '700', color: '#1A56FF', marginRight: 6 },
  inputFlex: { flex: 1, fontSize: 16, color: '#111' },

  categoriasScroll: { marginBottom: 16 },
  categoriaBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8 },
  categoriaBadgeActiva: { backgroundColor: '#1A56FF', borderColor: '#1A56FF' },
  categoriaText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoriaTextActiva: { color: '#fff', fontWeight: '700' },

  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  stockBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  stockNum: { fontSize: 24, fontWeight: '700', color: '#111', minWidth: 40, textAlign: 'center' },

  consejoCard: { flexDirection: 'row', backgroundColor: '#F0FFF0', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#C0E0C0' },
  consejoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#7CFC00', alignItems: 'center', justifyContent: 'center' },
  consejoInfo: { flex: 1 },
  consejoTitle: { fontSize: 14, fontWeight: '700', color: '#2D6A00', marginBottom: 4 },
  consejoText: { fontSize: 12, color: '#4A7A4A', lineHeight: 18 },

  footerBtn: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  publicarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A56FF', borderRadius: 14, padding: 16, gap: 8 },
  publicarBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});