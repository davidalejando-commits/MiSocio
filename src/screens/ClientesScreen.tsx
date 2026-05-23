// src/screens/ClientesScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput,
  Alert, Modal, Image, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerClientes, eliminarCliente, actualizarCliente } from '../database/clientesDB';
import { Cliente } from '../types';

type Filtro = 'Todos' | 'Deudores' | 'Al día';

export default function ClientesScreen({ navigation }: any) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('Todos');

  // Modal editar
  const [modalEditar, setModalEditar] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editLimite, setEditLimite] = useState('');
  const [editFotoUri, setEditFotoUri] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarClientes();
    }, [])
  );

  const cargarClientes = () => {
    const data = obtenerClientes();
    setClientes(data);
  };

  const clientesFiltrados = clientes.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro =
      filtro === 'Todos' ? true :
      filtro === 'Deudores' ? c.saldo_deuda > 0 :
      c.saldo_deuda === 0;
    return coincideBusqueda && coincideFiltro;
  });

  const totalPendiente = clientes.reduce((acc, c) => acc + c.saldo_deuda, 0);

  const getIniciales = (nombre: string) =>
    nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // ── Eliminar ────────────────────────────────────────────
  const confirmarEliminar = (cliente: Cliente) => {
    const tieneDeuda = cliente.saldo_deuda > 0;

    const mensaje = tieneDeuda
      ? `⚠️ ${cliente.nombre} tiene una deuda activa de $${cliente.saldo_deuda.toLocaleString('es-CO', { minimumFractionDigits: 2 })}.\n\nSi lo eliminas, se perderá todo su historial y no podrás cobrar esa deuda. ¿Deseas continuar de todas formas?`
      : `¿Seguro que deseas eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`;

    Alert.alert(
      tieneDeuda ? 'Cliente con deuda activa' : 'Eliminar cliente',
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            eliminarCliente(cliente.id);
            cargarClientes();
          },
        },
      ]
    );
  };

  // ── Editar ──────────────────────────────────────────────
  const abrirEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setEditNombre(cliente.nombre);
    setEditTelefono(cliente.telefono || '');
    setEditDireccion(cliente.direccion || '');
    setEditLimite(cliente.limite_credito ? String(cliente.limite_credito) : '');
    setEditFotoUri(cliente.foto_uri || null);
    setModalEditar(true);
  };

  const cerrarEditar = () => {
    setModalEditar(false);
    setClienteEditando(null);
  };

  const seleccionarFotoEditar = async () => {
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
      setEditFotoUri(result.assets[0].uri);
    }
  };

  const guardarEdicion = () => {
    if (!editNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!clienteEditando) return;
    setGuardando(true);
    try {
      actualizarCliente(clienteEditando.id, {
        nombre: editNombre.trim(),
        telefono: editTelefono.trim(),
        direccion: editDireccion.trim(),
        limite_credito: parseFloat(editLimite) || 0,
        foto_uri: editFotoUri,
      });
      cargarClientes();
      cerrarEditar();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Clientes</Text>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#1A56FF" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente por nombre..."
            placeholderTextColor="#aaa"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <View style={styles.filtrosRow}>
          {(['Todos', 'Deudores', 'Al día'] as Filtro[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filtroBadge, filtro === f && styles.filtroBadgeActivo]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[styles.filtroText, filtro === f && styles.filtroTextActivo]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#1A56FF' }]}>
            <Text style={styles.statLabelBlue}>TOTAL PENDIENTE</Text>
            <Text style={styles.statMontoBlue}>
              ${totalPendiente.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#7CFC00' }]}>
            <Text style={styles.statLabelGreen}>CLIENTES ACTIVOS</Text>
            <Text style={styles.statMontoGreen}>{clientes.length}</Text>
          </View>
        </View>

        <Text style={styles.hintText}>Mantén pulsado un cliente para eliminarlo o editarlo</Text>

        {clientesFiltrados.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>
              {clientes.length === 0 ? 'Aún no tienes clientes' : 'No se encontraron resultados'}
            </Text>
            {clientes.length === 0 && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('NuevoCliente')}
              >
                <Text style={styles.emptyBtnText}>Agregar primer cliente</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          clientesFiltrados.map(cliente => (
            <TouchableOpacity
              key={cliente.id}
              style={styles.clienteCard}
              onPress={() => navigation.navigate('EstadoCuenta', { cliente })}
              onLongPress={() => {
                Alert.alert(
                  cliente.nombre,
                  '¿Qué deseas hacer?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: '✏️ Editar', onPress: () => abrirEditar(cliente) },
                    { text: '🗑️ Eliminar', style: 'destructive', onPress: () => confirmarEliminar(cliente) },
                  ]
                );
              }}
            >
              {/* Avatar: foto o iniciales */}
              <View style={styles.clienteAvatar}>
                {cliente.foto_uri ? (
                  <Image source={{ uri: cliente.foto_uri }} style={styles.clienteFoto} />
                ) : (
                  <Text style={styles.clienteIniciales}>{getIniciales(cliente.nombre)}</Text>
                )}
              </View>

              <View style={styles.clienteInfo}>
                <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
                <Text style={styles.clienteNegocio}>{cliente.telefono || 'Sin teléfono'}</Text>
              </View>
              <View style={styles.clienteRight}>
                <Text style={[
                  styles.clienteEstado,
                  { color: cliente.saldo_deuda > 0 ? '#E53E3E' : '#1A8C1A' }
                ]}>
                  {cliente.saldo_deuda > 0 ? 'DEUDOR' : 'AL DÍA'}
                </Text>
                <Text style={[
                  styles.clienteSaldo,
                  { color: cliente.saldo_deuda > 0 ? '#E53E3E' : '#333' }
                ]}>
                  ${cliente.saldo_deuda.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NuevoCliente')}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal Editar Cliente ─────────────────────────── */}
      <Modal visible={modalEditar} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={cerrarEditar}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalCard}>

                  {/* Header modal */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Editar Cliente</Text>
                    <TouchableOpacity onPress={cerrarEditar} style={styles.modalCloseBtn}>
                      <Ionicons name="close" size={20} color="#555" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>

                    {/* Foto */}
                    <TouchableOpacity style={styles.fotoEditWrap} onPress={seleccionarFotoEditar}>
                      {editFotoUri ? (
                        <Image source={{ uri: editFotoUri }} style={styles.fotoEditPreview} />
                      ) : (
                        <View style={styles.fotoEditPlaceholder}>
                          <Ionicons name="camera-outline" size={28} color="#aaa" />
                          <Text style={styles.fotoEditText}>Cambiar foto</Text>
                        </View>
                      )}
                      <View style={styles.fotoEditBadge}>
                        <Ionicons name="camera" size={14} color="#fff" />
                      </View>
                    </TouchableOpacity>

                    {/* Campos */}
                    <Text style={styles.modalLabel}>Nombre completo</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editNombre}
                      onChangeText={setEditNombre}
                      placeholder="Nombre del cliente"
                      placeholderTextColor="#bbb"
                    />

                    <Text style={styles.modalLabel}>Teléfono</Text>
                    <View style={styles.modalInputRow}>
                      <Ionicons name="call-outline" size={16} color="#aaa" />
                      <TextInput
                        style={styles.modalInputFlex}
                        value={editTelefono}
                        onChangeText={setEditTelefono}
                        placeholder="+57 123 456 7890"
                        placeholderTextColor="#bbb"
                        keyboardType="phone-pad"
                      />
                    </View>

                    <Text style={styles.modalLabel}>Dirección</Text>
                    <TextInput
                      style={[styles.modalInput, { height: 72, textAlignVertical: 'top' }]}
                      value={editDireccion}
                      onChangeText={setEditDireccion}
                      placeholder="Dirección del cliente"
                      placeholderTextColor="#bbb"
                      multiline
                    />

                    <Text style={styles.modalLabel}>Límite de crédito</Text>
                    <View style={styles.modalInputRow}>
                      <Text style={styles.modalInputPrefix}>$</Text>
                      <TextInput
                        style={styles.modalInputFlex}
                        value={editLimite}
                        onChangeText={setEditLimite}
                        placeholder="0.00"
                        placeholderTextColor="#bbb"
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.modalGuardarBtn, guardando && { opacity: 0.7 }]}
                      onPress={guardarEdicion}
                      disabled={guardando}
                    >
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.modalGuardarText}>
                        {guardando ? 'Guardando...' : 'Guardar Cambios'}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ height: 20 }} />
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A56FF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, marginBottom: 14, height: 46 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  filtrosRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  filtroBadge: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  filtroBadgeActivo: { backgroundColor: '#1A56FF', borderColor: '#1A56FF' },
  filtroText: { fontSize: 14, color: '#555', fontWeight: '500' },
  filtroTextActivo: { color: '#fff', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 16 },
  statLabelBlue: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  statMontoBlue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabelGreen: { fontSize: 11, fontWeight: '700', color: 'rgba(0,80,0,0.7)', marginBottom: 6 },
  statMontoGreen: { fontSize: 36, fontWeight: '700', color: '#2D6A00' },

  hintText: { fontSize: 12, color: '#bbb', textAlign: 'center', marginBottom: 14 },

  clienteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  clienteAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  clienteFoto: { width: 50, height: 50, borderRadius: 25 },
  clienteIniciales: { fontSize: 16, fontWeight: '700', color: '#1A56FF' },
  clienteInfo: { flex: 1 },
  clienteNombre: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 3 },
  clienteNegocio: { fontSize: 13, color: '#888' },
  clienteRight: { alignItems: 'flex-end', gap: 4 },
  clienteEstado: { fontSize: 12, fontWeight: '700' },
  clienteSaldo: { fontSize: 16, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: '#aaa', fontWeight: '500' },
  emptyBtn: { backgroundColor: '#1A56FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },

  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1A56FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#1A56FF', shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

  // ── Modal ──────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },

  fotoEditWrap: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
  fotoEditPreview: { width: 90, height: 90, borderRadius: 45 },
  fotoEditPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  fotoEditText: { fontSize: 11, color: '#aaa' },
  fotoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#1A56FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

  modalLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', marginBottom: 14 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, marginBottom: 14, height: 48, gap: 8 },
  modalInputFlex: { flex: 1, fontSize: 15, color: '#111' },
  modalInputPrefix: { fontSize: 16, fontWeight: '700', color: '#1A56FF' },
  modalGuardarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A56FF', borderRadius: 14, padding: 16, gap: 8, marginTop: 8 },
  modalGuardarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});