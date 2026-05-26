// src/screens/EstadoCuentaScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import {
  obtenerClientePorId,
  obtenerHistorialCliente,
  registrarAbono,
  actualizarCliente,
} from "../database/clientesDB";
import { obtenerItemsVenta } from "../database/ventasDB";
import { Cliente } from "../types";

export default function EstadoCuentaScreen({ navigation, route }: any) {
  const clienteParam = route?.params?.cliente;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [montoAbono, setMontoAbono] = useState("");
  const [metodoAbono, setMetodoAbono] = useState<"efectivo" | "transferencia">("efectivo");
  const [guardando, setGuardando] = useState(false);

  const [modalDetalle, setModalDetalle] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);
  const [itemsVenta, setItemsVenta] = useState<any[]>([]);

  // ── Estados modal editar ──────────────────────────────
  const [modalEditar, setModalEditar] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editLimite, setEditLimite] = useState("");
  const [editFotoUri, setEditFotoUri] = useState<string | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  const cargarDatos = () => {
    if (!clienteParam?.id) return;
    const data = obtenerClientePorId(clienteParam.id);
    const hist = obtenerHistorialCliente(clienteParam.id);
    setCliente(data);
    setHistorial(hist);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setMontoAbono("");
  };

  const abrirDetalle = (item: any) => {
    setItemSeleccionado(item);
    if (item.tipo === "venta") {
      const items = obtenerItemsVenta(item.id);
      setItemsVenta(items);
    } else {
      setItemsVenta([]);
    }
    setModalDetalle(true);
  };

  const cerrarDetalle = () => {
    setModalDetalle(false);
    setItemSeleccionado(null);
    setItemsVenta([]);
  };

  // ── Editar cliente ────────────────────────────────────
  const abrirEditar = () => {
    if (!cliente) return;
    setEditNombre(cliente.nombre);
    setEditTelefono(cliente.telefono || "");
    setEditDireccion(cliente.direccion || "");
    setEditLimite(cliente.limite_credito ? String(cliente.limite_credito) : "");
    setEditFotoUri(cliente.foto_uri || null);
    setModalEditar(true);
  };

  const seleccionarFotoEditar = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setEditFotoUri(result.assets[0].uri);
  };

  const guardarEdicion = () => {
    if (!editNombre.trim() || !cliente) return;
    setGuardandoEdicion(true);
    try {
      actualizarCliente(cliente.id, {
        nombre: editNombre.trim(),
        telefono: editTelefono.trim(),
        direccion: editDireccion.trim(),
        limite_credito: parseFloat(editLimite) || 0,
        foto_uri: editFotoUri,
      });
      setModalEditar(false);
      cargarDatos();
    } catch {
      Alert.alert("Error", "No se pudo actualizar el cliente");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const confirmarAbono = () => {
    const monto = parseFloat(montoAbono);
    if (!monto || isNaN(monto) || monto <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }
    if (cliente && monto > cliente.saldo_deuda) {
      Alert.alert(
        "Error",
        `El monto no puede superar la deuda de $${cliente.saldo_deuda.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
      );
      return;
    }
    setGuardando(true);
    try {
      registrarAbono(clienteParam.id, monto, metodoAbono);
      Alert.alert(
        "Éxito",
        `Abono de $${monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })} registrado`,
        [{ text: "OK", onPress: () => { cerrarModal(); cargarDatos(); } }],
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo registrar el abono");
    } finally {
      setGuardando(false);
    }
  };

  const parseFecha = (fecha: string): Date | null => {
  if (!fecha) return null;
  if (fecha.includes('NaN') || fecha.includes('nan')) return null;
  if (fecha.trim() === '') return null;  // ← trim() en minúscula, es JS
  const iso = fecha.trim().replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

  const formatFecha = (fecha: string) => {
    const d = parseFecha(fecha);
    if (!d) return "Fecha no disponible";
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatFechaDetalle = (fecha: string) => {
    const d = parseFecha(fecha);
    if (!d) return { fecha: "Fecha no disponible", hora: "—" };
    return {
      fecha: d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
      hora: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  const esIngreso = (item: any) =>
    item.tipo === "abono" || (item.tipo === "venta" && item.detalle !== "credito");

  const iconoPorItem = (item: any) => {
    if (item.tipo === "abono") return { name: "checkmark-circle", color: "#1A8C1A", bg: "#E6FFE6" };
    if (item.detalle === "efectivo") return { name: "cash", color: "#1A8C1A", bg: "#E6FFE6" };
    if (item.detalle === "transferencia") return { name: "phone-portrait", color: "#1A8C1A", bg: "#E6FFE6" };
    return { name: "time", color: "#E53E3E", bg: "#FFE6E6" };
  };

  const descripcionItem = (item: any) => {
    if (item.tipo === "abono") return "Abono recibido";
    if (item.detalle === "efectivo") return "Venta en efectivo";
    if (item.detalle === "transferencia") return "Venta por transferencia";
    return "Venta a crédito";
  };

  const getIniciales = (nombre: string) =>
    nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  if (!cliente) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A56FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estado de Cuenta</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={22} color="#1A56FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Info cliente — tappable para editar */}
        <TouchableOpacity style={styles.clienteCard} onPress={abrirEditar} activeOpacity={0.85}>
          <View style={styles.clienteAvatar}>
            {cliente.foto_uri ? (
              <Image source={{ uri: cliente.foto_uri }} style={styles.clienteFoto} />
            ) : (
              <Text style={styles.clienteIniciales}>{getIniciales(cliente.nombre)}</Text>
            )}
          </View>
          <View style={styles.clienteInfo}>
            <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
            {cliente.telefono ? (
              <View style={styles.clienteTelRow}>
                <Ionicons name="call-outline" size={14} color="#888" />
                <Text style={styles.clienteTel}>{cliente.telefono}</Text>
              </View>
            ) : null}
            {cliente.direccion ? (
              <View style={styles.clienteTelRow}>
                <Ionicons name="location-outline" size={14} color="#888" />
                <Text style={styles.clienteTel}>{cliente.direccion}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.editarBtnWrap}>
            <Ionicons name="pencil-outline" size={16} color="#1A56FF" />
          </View>
        </TouchableOpacity>

        {/* Saldo total */}
        <View style={styles.saldoCard}>
          <View style={styles.saldoCardIcon}>
            <Ionicons name="wallet-outline" size={48} color="rgba(255,255,255,0.2)" />
          </View>
          <Text style={styles.saldoLabel}>Saldo Total</Text>
          <Text style={styles.saldoMonto}>
            ${cliente.saldo_deuda.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.saldoBadge}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.saldoBadgeText}>
              {"  "}Límite de crédito: ${cliente.limite_credito.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Estado deuda */}
        <View style={styles.estadoRow}>
          <View style={[styles.estadoCard, { borderColor: cliente.saldo_deuda > 0 ? "#FFD0D0" : "#C0E0C0" }]}>
            <Text style={styles.estadoLabel}>Estado</Text>
            <Text style={[styles.estadoValor, { color: cliente.saldo_deuda > 0 ? "#E53E3E" : "#1A8C1A" }]}>
              {cliente.saldo_deuda > 0 ? "CON DEUDA" : "AL DÍA"}
            </Text>
          </View>
          <View style={[styles.estadoCard, { borderColor: "#E0E0E0" }]}>
            <Text style={styles.estadoLabel}>Transacciones</Text>
            <Text style={styles.estadoValor}>{historial.length}</Text>
          </View>
        </View>

        {/* Botón registrar abono */}
        {cliente.saldo_deuda > 0 && (
          <TouchableOpacity style={styles.abonoBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.abonoBtnText}>Registrar Abono</Text>
          </TouchableOpacity>
        )}

        {/* Historial */}
        <View style={styles.historialHeader}>
          <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
        </View>

        {historial.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={40} color="#ddd" />
            <Text style={styles.emptyText}>Sin transacciones aún</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {historial.map((item, index) => {
              const ingreso = esIngreso(item);
              const icono = iconoPorItem(item);
              const descripcion = descripcionItem(item);
              return (
                <TouchableOpacity
                  key={`${item.tipo}-${item.id}`}
                  style={styles.timelineItem}
                  onPress={() => abrirDetalle(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineIcon, { backgroundColor: icono.bg }]}>
                      <Ionicons name={icono.name as any} size={16} color={icono.color} />
                    </View>
                    {index < historial.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardTop}>
                      <Text style={[styles.timelineDesc, { color: icono.color }]}>{descripcion}</Text>
                      <Text style={[styles.timelineMonto, { color: ingreso ? "#1A8C1A" : "#E53E3E" }]}>
                        {ingreso ? "+" : "-"}${item.monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={styles.timelineCardBottom}>
                      <Text style={styles.timelineFecha}>
                        {formatFecha(item.created_at)} • {item.detalle}
                      </Text>
                      <Ionicons name="chevron-forward" size={13} color="#ccc" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal abono ─────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <TouchableWithoutFeedback onPress={cerrarModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Registrar Abono</Text>
                    <TouchableOpacity onPress={cerrarModal}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalDeuda}>
                    Deuda actual: ${cliente.saldo_deuda.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.modalLabel}>Monto del abono</Text>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputPrefix}>$</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      value={montoAbono}
                      onChangeText={setMontoAbono}
                      autoFocus
                    />
                  </View>
                  <Text style={styles.modalLabel}>Método de pago</Text>
                  <View style={styles.metodosRow}>
                    {(["efectivo", "transferencia"] as const).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.metodoBadge, metodoAbono === m && styles.metodoBadgeActivo]}
                        onPress={() => setMetodoAbono(m)}
                      >
                        <Ionicons
                          name={m === "efectivo" ? "cash-outline" : "phone-portrait-outline"}
                          size={16}
                          color={metodoAbono === m ? "#fff" : "#555"}
                        />
                        <Text style={[styles.metodoText, metodoAbono === m && styles.metodoTextActivo]}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.modalBtn, guardando && { opacity: 0.7 }]}
                    onPress={confirmarAbono}
                    disabled={guardando}
                  >
                    <Text style={styles.modalBtnText}>
                      {guardando ? "Registrando..." : "Confirmar Abono"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal detalle transacción ────────────────────── */}
      <Modal visible={modalDetalle} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={cerrarDetalle}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleWrap}>
                    <Ionicons
                      name={itemSeleccionado?.tipo === "abono" ? "checkmark-circle-outline" : "receipt-outline"}
                      size={20}
                      color="#1A56FF"
                    />
                    <Text style={styles.modalTitle}>
                      {itemSeleccionado?.tipo === "abono" ? "Detalle de Abono" : "Detalle de Venta"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={cerrarDetalle} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color="#555" />
                  </TouchableOpacity>
                </View>
                {itemSeleccionado && (() => {
                  const ingreso = esIngreso(itemSeleccionado);
                  const icono = iconoPorItem(itemSeleccionado);
                  const { fecha, hora } = formatFechaDetalle(itemSeleccionado.created_at);
                  return (
                    <>
                      <View style={[styles.estadoGrandeBadge, { backgroundColor: icono.bg }]}>
                        <Ionicons name={icono.name as any} size={15} color={icono.color} />
                        <Text style={[styles.estadoGrandeText, { color: icono.color }]}>
                          {descripcionItem(itemSeleccionado)}
                        </Text>
                      </View>
                      <View style={styles.detalleSeccion}>
                        <View style={styles.detalleRow}>
                          <View style={styles.detalleRowLeft}>
                            <Ionicons name="calendar-outline" size={15} color="#888" />
                            <Text style={styles.detalleLabel}>Fecha</Text>
                          </View>
                          <Text style={styles.detalleValor}>{fecha}</Text>
                        </View>
                        <View style={styles.detalleRow}>
                          <View style={styles.detalleRowLeft}>
                            <Ionicons name="time-outline" size={15} color="#888" />
                            <Text style={styles.detalleLabel}>Hora</Text>
                          </View>
                          <Text style={styles.detalleValor}>{hora}</Text>
                        </View>
                        <View style={styles.detalleRow}>
                          <View style={styles.detalleRowLeft}>
                            <Ionicons name="card-outline" size={15} color="#888" />
                            <Text style={styles.detalleLabel}>
                              {itemSeleccionado.tipo === "abono" ? "Método" : "Tipo de pago"}
                            </Text>
                          </View>
                          <View style={[styles.tipoPagoBadge, { backgroundColor: icono.bg }]}>
                            <Text style={[styles.tipoPagoText, { color: icono.color }]}>
                              {itemSeleccionado.detalle
                                ? itemSeleccionado.detalle.charAt(0).toUpperCase() + itemSeleccionado.detalle.slice(1)
                                : "—"}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {itemSeleccionado.tipo === "venta" && (
                        <>
                          <Text style={styles.productosTitle}>Productos vendidos</Text>
                          <View style={styles.productosWrap}>
                            {itemsVenta.length === 0 ? (
                              <Text style={styles.sinItems}>Sin detalle de productos</Text>
                            ) : (
                              itemsVenta.map((it, idx) => (
                                <View key={idx} style={[styles.itemRow, idx < itemsVenta.length - 1 && styles.itemRowBorder]}>
                                  <View style={styles.itemIconWrap}>
                                    <Ionicons name="cube-outline" size={15} color="#1A56FF" />
                                  </View>
                                  <View style={styles.itemInfo}>
                                    <Text style={styles.itemNombre}>{it.producto_nombre}</Text>
                                    <Text style={styles.itemPrecioUnit}>
                                      ${it.precio_unitario.toLocaleString("es-CO", { minimumFractionDigits: 2 })} c/u
                                    </Text>
                                  </View>
                                  <View style={styles.itemRight}>
                                    <Text style={styles.itemCantidad}>×{it.cantidad}</Text>
                                    <Text style={styles.itemSubtotal}>
                                      ${(it.precio_unitario * it.cantidad).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                    </Text>
                                  </View>
                                </View>
                              ))
                            )}
                          </View>
                        </>
                      )}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                          {itemSeleccionado.tipo === "abono" ? "Monto abonado" : "Total venta"}
                        </Text>
                        <Text style={[styles.totalMonto, { color: ingreso ? "#1A8C1A" : "#E53E3E" }]}>
                          {ingreso ? "+" : "-"}${itemSeleccionado.monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Modal editar cliente ─────────────────────────── */}
      <Modal visible={modalEditar} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={() => setModalEditar(false)}>
            <View style={styles.modalOverlayBottom}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalCardBottom}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Editar Cliente</Text>
                    <TouchableOpacity onPress={() => setModalEditar(false)} style={styles.modalCloseBtn}>
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

                    <Text style={styles.modalLabel}>Nombre completo</Text>
                    <TextInput
                      style={styles.modalInputEdit}
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
                      style={[styles.modalInputEdit, { height: 72, textAlignVertical: "top" }]}
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
                      style={[styles.modalBtn, guardandoEdicion && { opacity: 0.7 }]}
                      onPress={guardarEdicion}
                      disabled={guardandoEdicion}
                    >
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>
                        {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
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
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#888" },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#111", textAlign: "center" },
  shareBtn: { padding: 4 },

  clienteCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F0F0F0", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  clienteAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" },
  clienteFoto: { width: 52, height: 52, borderRadius: 26 },
  clienteIniciales: { fontSize: 18, fontWeight: "700", color: "#1A56FF" },
  clienteInfo: { flex: 1, gap: 4 },
  clienteNombre: { fontSize: 16, fontWeight: "700", color: "#111" },
  clienteTelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  clienteTel: { fontSize: 13, color: "#888" },
  editarBtnWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center" },

  saldoCard: { backgroundColor: "#1A56FF", borderRadius: 16, padding: 20, marginBottom: 14, overflow: "hidden" },
  saldoCardIcon: { position: "absolute", right: 16, top: 16 },
  saldoLabel: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 4 },
  saldoMonto: { color: "#fff", fontSize: 34, fontWeight: "700", marginBottom: 8 },
  saldoBadge: { flexDirection: "row", alignItems: "center" },
  saldoBadgeText: { color: "rgba(255,255,255,0.85)", fontSize: 13 },

  estadoRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  estadoCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  estadoLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  estadoValor: { fontSize: 16, fontWeight: "700", color: "#111" },

  abonoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1A56FF", borderRadius: 14, padding: 16, marginBottom: 24, gap: 8 },
  abonoBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  historialHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111" },

  timeline: { gap: 0 },
  timelineItem: { flexDirection: "row", gap: 12 },
  timelineLeft: { alignItems: "center", width: 32 },
  timelineIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#F0F0F0", marginVertical: 4 },
  timelineCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#F0F0F0" },
  timelineCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  timelineCardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timelineDesc: { fontSize: 14, fontWeight: "600", flex: 1 },
  timelineMonto: { fontSize: 14, fontWeight: "700" },
  timelineFecha: { fontSize: 12, color: "#888" },

  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: "#aaa" },

  // Modal abono / detalle (centrado)
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  modalDeuda: { fontSize: 13, color: "#888", marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  modalInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, height: 52 },
  modalInputPrefix: { fontSize: 16, fontWeight: "700", color: "#1A56FF", marginRight: 6 },
  modalInput: { flex: 1, fontSize: 18, color: "#111" },
  metodosRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  metodoBadge: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 6 },
  metodoBadgeActivo: { backgroundColor: "#1A56FF", borderColor: "#1A56FF" },
  metodoText: { fontSize: 14, fontWeight: "600", color: "#555" },
  metodoTextActivo: { color: "#fff" },
  modalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1A56FF", borderRadius: 14, padding: 16, gap: 8 },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Modal detalle
  estadoGrandeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14, alignSelf: "flex-start" },
  estadoGrandeText: { fontSize: 13, fontWeight: "700" },
  detalleSeccion: { backgroundColor: "#F8F8F8", borderRadius: 12, padding: 14, marginBottom: 14, gap: 12 },
  detalleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detalleRowLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  detalleLabel: { fontSize: 13, color: "#888" },
  detalleValor: { fontSize: 13, fontWeight: "600", color: "#111" },
  tipoPagoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tipoPagoText: { fontSize: 12, fontWeight: "700" },
  productosTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 10 },
  productosWrap: { backgroundColor: "#F8F8F8", borderRadius: 12, padding: 12, marginBottom: 14 },
  sinItems: { fontSize: 13, color: "#aaa", textAlign: "center", paddingVertical: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  itemIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 13, fontWeight: "600", color: "#111", marginBottom: 2 },
  itemPrecioUnit: { fontSize: 11, color: "#888" },
  itemRight: { alignItems: "flex-end", gap: 2 },
  itemCantidad: { fontSize: 12, color: "#888" },
  itemSubtotal: { fontSize: 13, fontWeight: "700", color: "#111" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 14 },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#888" },
  totalMonto: { fontSize: 22, fontWeight: "700" },

  // Modal editar (sheet desde abajo)
  modalOverlayBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCardBottom: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  fotoEditWrap: { alignSelf: "center", marginBottom: 20, position: "relative" },
  fotoEditPreview: { width: 90, height: 90, borderRadius: 45 },
  fotoEditPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", gap: 4 },
  fotoEditText: { fontSize: 11, color: "#aaa" },
  fotoEditBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#1A56FF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  modalInputEdit: { backgroundColor: "#F5F5F5", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111", marginBottom: 14 },
  modalInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 10, paddingHorizontal: 14, marginBottom: 14, height: 48, gap: 8 },
  modalInputFlex: { flex: 1, fontSize: 15, color: "#111" },
});