// src/screens/InventarioScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Image, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerProductos, eliminarProducto } from '../database/inventarioDB';
import { Producto } from '../types';

const CATEGORIAS = ['Todos', 'Electrónica', 'Hogar', 'Ropa', 'Alimentos', 'Otro'];

export default function InventarioScreen({ navigation }: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [])
  );

  const cargarProductos = () => {
    const data = obtenerProductos();
    setProductos(data);
  };

  const confirmarEliminar = (producto: Producto) => {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que deseas eliminar "${producto.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            eliminarProducto(producto.id);
            cargarProductos();
          }
        }
      ]
    );
  };

  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
    return coincideCategoria && coincideBusqueda;
  });

  const bajoStock = productos.filter(p => p.stock <= 5).length;
  const totalItems = productos.reduce((acc, p) => acc + p.stock, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi Inventario</Text>
          <Text style={styles.headerSub}>Gestiona tus existencias</Text>
        </View>
        <TouchableOpacity
          style={styles.nuevoBtn}
          onPress={() => navigation.navigate('NuevoProducto')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.nuevoBtnText}>Nuevo Producto</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FFF0F0', borderColor: '#FFD0D0' }]}>
          <Ionicons name="warning-outline" size={18} color="#E53E3E" />
          <Text style={styles.statNumRed}>{bajoStock}</Text>
          <Text style={styles.statLabelRed}>Bajo Stock</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F0FFF0', borderColor: '#C0E0C0' }]}>
          <Ionicons name="archive-outline" size={18} color="#1A8C1A" />
          <Text style={styles.statNumGreen}>{totalItems}</Text>
          <Text style={styles.statLabelGreen}>Total Items</Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto por nombre..."
            placeholderTextColor="#bbb"
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categoriasContent}
      >
        {CATEGORIAS.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoriaBadge, categoriaActiva === cat && styles.categoriaBadgeActiva]}
            onPress={() => setCategoriaActiva(cat)}
          >
            <Text style={[styles.categoriaText, categoriaActiva === cat && styles.categoriaTextActiva]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista productos */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {productosFiltrados.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="archive-outline" size={52} color="#ddd" />
            <Text style={styles.emptyText}>
              {busqueda.length > 0
                ? `Sin resultados para "${busqueda}"`
                : productos.length === 0
                  ? 'Aún no tienes productos'
                  : 'No hay productos en esta categoría'}
            </Text>
            {productos.length === 0 && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('NuevoProducto')}
              >
                <Text style={styles.emptyBtnText}>Agregar primer producto</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          productosFiltrados.map(producto => (
            <TouchableOpacity
              key={producto.id}
              style={styles.productoCard}
              onLongPress={() => confirmarEliminar(producto)}
            >
              {/* Foto o placeholder */}
              <View style={styles.productoImgWrap}>
                {producto.foto_uri ? (
                  <Image source={{ uri: producto.foto_uri }} style={styles.productoImg} />
                ) : (
                  <View style={styles.productoImgPlaceholder}>
                    <Ionicons name="cube-outline" size={32} color="#ccc" />
                  </View>
                )}
                {producto.stock <= 5 && (
                  <View style={styles.bajoStockBadge}>
                    <Ionicons name="warning" size={10} color="#fff" />
                    <Text style={styles.bajoStockText}>BAJO STOCK</Text>
                  </View>
                )}
              </View>

              <View style={styles.productoInfo}>
                <View style={styles.productoInfoTop}>
                  <Text style={styles.productoNombre}>{producto.nombre}</Text>
                  <Text style={styles.productoPrecio}>
                    ${producto.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.productoInfoBottom}>
                  <View>
                    <Text style={styles.productoStockLabel}>EXISTENCIAS</Text>
                    <Text style={[
                      styles.productoStock,
                      { color: producto.stock <= 5 ? '#E53E3E' : '#333' }
                    ]}>
                      {producto.stock} unidades
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('NuevoProducto', { producto })}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  nuevoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A56FF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6 },
  nuevoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  statNumRed: { fontSize: 20, fontWeight: '700', color: '#E53E3E' },
  statLabelRed: { fontSize: 12, color: '#E53E3E', fontWeight: '500' },
  statNumGreen: { fontSize: 20, fontWeight: '700', color: '#1A8C1A' },
  statLabelGreen: { fontSize: 12, color: '#1A8C1A', fontWeight: '500' },

  searchWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },

  categoriasScroll: { backgroundColor: '#fff', maxHeight: 52 },
  categoriasContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoriaBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  categoriaBadgeActiva: { backgroundColor: '#1A56FF', borderColor: '#1A56FF' },
  categoriaText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoriaTextActiva: { color: '#fff', fontWeight: '700' },

  productoCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  productoImgWrap: { width: '100%', height: 160, backgroundColor: '#F5F5F5', position: 'relative' },
  productoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  productoImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bajoStockBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53E3E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  bajoStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  productoInfo: { padding: 14 },
  productoInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productoNombre: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1 },
  productoPrecio: { fontSize: 16, fontWeight: '700', color: '#1A56FF' },
  productoInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productoStockLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 0.5, marginBottom: 2 },
  productoStock: { fontSize: 14, fontWeight: '600' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#aaa', fontWeight: '500' },
  emptyBtn: { backgroundColor: '#1A56FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});