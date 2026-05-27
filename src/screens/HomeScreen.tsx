// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  obtenerTotalHoy,
  obtenerTotalAyer,
  obtenerVentasHoy,
} from "../database/ventasDB";
import { obtenerClientes } from "../database/clientesDB";

const STORAGE_KEY_NOMBRE = "@negocio_nombre";
const STORAGE_KEY_FOTO = "@negocio_foto";

export default function HomeScreen({ navigation }: any) {
  const [ventasHoy, setVentasHoy] = useState(0);
  const [porcentajeCambio, setPorcentajeCambio] = useState(0);
  const [cobrosPendientes, setCobrosPendientes] = useState(0);
  const [clientesDeuda, setClientesDeuda] = useState(0);
  const [actividadReciente, setActividadReciente] = useState<any[]>([]);
  const [totalAyer, setTotalAyer] = useState(0);

  // ── Negocio ──────────────────────────────────────────
  const [nombreNegocio, setNombreNegocio] = useState("Mi Negocio");
  const [fotoNegocio, setFotoNegocio] = useState<string | null>(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editFoto, setEditFoto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
      cargarPerfil();
    }, []),
  );

  const cargarDatos = () => {
    const totalHoy = obtenerTotalHoy();
    const totalAyerVal = obtenerTotalAyer();
    const clientes = obtenerClientes();
    const ventasDelDia = obtenerVentasHoy();

    const cambio =
      totalAyerVal > 0
        ? Math.round(((totalHoy - totalAyerVal) / totalAyerVal) * 100)
        : 0;

    const pendiente = clientes.reduce((acc, c) => acc + c.saldo_deuda, 0);
    const conDeuda = clientes.filter((c) => c.saldo_deuda > 0).length;

    setVentasHoy(totalHoy);
    setPorcentajeCambio(cambio);
    setCobrosPendientes(pendiente);
    setClientesDeuda(conDeuda);
    setActividadReciente(ventasDelDia.slice(0, 5));
    setTotalAyer(totalAyerVal);
  };

  const cargarPerfil = async () => {
    try {
      const nombre = await AsyncStorage.getItem(STORAGE_KEY_NOMBRE);
      const foto = await AsyncStorage.getItem(STORAGE_KEY_FOTO);
      if (nombre) setNombreNegocio(nombre);
      if (foto) setFotoNegocio(foto);
    } catch {}
  };

  const abrirEditar = () => {
    setEditNombre(nombreNegocio);
    setEditFoto(fotoNegocio);
    setModalEditar(true);
  };

  const seleccionarFoto = async () => {
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
    if (!result.canceled) setEditFoto(result.assets[0].uri);
  };

  const guardarPerfil = async () => {
    if (!editNombre.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }
    setGuardando(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_NOMBRE, editNombre.trim());
      if (editFoto) {
        await AsyncStorage.setItem(STORAGE_KEY_FOTO, editFoto);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_FOTO);
      }
      setNombreNegocio(editNombre.trim());
      setFotoNegocio(editFoto);
      setModalEditar(false);
    } catch {
      Alert.alert("Error", "No se pudo guardar el perfil");
    } finally {
      setGuardando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha || fecha.includes("NaN") || fecha.trim() === "") return "Sin fecha";
    const d = new Date(fecha.trim().replace(" ", "T"));
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const inicialesNegocio = nombreNegocio
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={abrirEditar}
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              {fotoNegocio ? (
                <Image source={{ uri: fotoNegocio }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{inicialesNegocio}</Text>
              )}
              {/* Badge editar */}
              <View style={styles.avatarBadge}>
                <Ionicons name="pencil" size={8} color="#fff" />
              </View>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {nombreNegocio}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card ventas hoy */}
        <View style={styles.cardVentas}>
          <View style={styles.cardVentasIcon}>
            <Ionicons name="wallet-outline" size={40} color="rgba(255,255,255,0.3)" />
          </View>
          <Text style={styles.cardVentasLabel}>Ventas de hoy</Text>
          <Text style={styles.cardVentasMonto}>
            ${ventasHoy.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.cardVentasBadge}>
            {totalAyer === 0 ? (
              <Text style={[styles.cardVentasBadgeText, { color: "rgba(255,255,255,0.7)" }]}>
                Sin datos de ayer para comparar
              </Text>
            ) : (
              <>
                <Ionicons
                  name={porcentajeCambio >= 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={porcentajeCambio >= 0 ? "#4AFF91" : "#FF6B6B"}
                />
                <Text style={[styles.cardVentasBadgeText, { color: porcentajeCambio >= 0 ? "#4AFF91" : "#FF6B6B" }]}>
                  {"  "}{porcentajeCambio >= 0 ? "+" : ""}{porcentajeCambio}% vs ayer
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Card cobros pendientes */}
        <View style={styles.cardCobros}>
          <View style={styles.cardCobrosTop}>
            <View>
              <Text style={styles.cardCobrosLabel}>Cobros pendientes</Text>
              <Text style={styles.cardCobrosMonto}>
                ${cobrosPendientes.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.cardCobrosIconWrap}>
              <Ionicons name="alert-circle" size={24} color="#E53E3E" />
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: cobrosPendientes > 0 ? "55%" : "0%" }]} />
          </View>
          <Text style={styles.cardCobrosSubtitle}>
            {clientesDeuda} {clientesDeuda === 1 ? "cliente" : "clientes"} con deuda activa
          </Text>
        </View>

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.accionesRow}>
          <TouchableOpacity
            style={[styles.accionBtn, { backgroundColor: "#7CFC00" }]}
            onPress={() => navigation.navigate("Sales")}
          >
            <View style={styles.accionIconWrap}>
              <Ionicons name="cart" size={28} color="#2D6A00" />
            </View>
            <Text style={[styles.accionLabel, { color: "#2D6A00" }]}>Nueva Venta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accionBtn, { backgroundColor: "#EEF0FF" }]}
            onPress={() => navigation.navigate("Clients", { screen: "NuevoCliente" })}
          >
            <View style={styles.accionIconWrap}>
              <Ionicons name="person-add" size={28} color="#1A56FF" />
            </View>
            <Text style={[styles.accionLabel, { color: "#1A56FF" }]}>Registrar{"\n"}Cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accionBtn, { backgroundColor: "#FFF0E6" }]}
            onPress={() => navigation.navigate("Inventory", { screen: "NuevoProducto" })}
          >
            <View style={styles.accionIconWrap}>
              <Ionicons name="archive" size={28} color="#C05A00" />
            </View>
            <Text style={[styles.accionLabel, { color: "#C05A00" }]}>Añadir{"\n"}Producto</Text>
          </TouchableOpacity>
        </View>

        {/* Actividad reciente */}
        <View style={styles.actividadHeader}>
          <Text style={styles.sectionTitle}>Actividad reciente</Text>
          <TouchableOpacity onPress={() => navigation.navigate("History")}>
            <Text style={styles.verTodo}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {actividadReciente.length === 0 ? (
          <View style={styles.emptyActividad}>
            <Ionicons name="receipt-outline" size={36} color="#ddd" />
            <Text style={styles.emptyActividadText}>No hay actividad hoy</Text>
          </View>
        ) : (
          actividadReciente.map((venta) => (
            <View key={venta.id} style={styles.actividadItem}>
              <View style={styles.actividadIconWrap}>
                <Ionicons
                  name={venta.estado === "pagado" ? "receipt" : "time"}
                  size={20}
                  color={venta.estado === "pagado" ? "#1A56FF" : "#888"}
                />
              </View>
              <View style={styles.actividadInfo}>
                <Text style={styles.actividadNombre}>
                  {venta.cliente_nombre ? `Venta a ${venta.cliente_nombre}` : "Venta directa"}
                </Text>
                <Text style={styles.actividadTiempo}>{formatFecha(venta.created_at)}</Text>
              </View>
              <View style={styles.actividadRight}>
                <Text style={[styles.actividadMonto, { color: "#1A56FF" }]}>
                  +${venta.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </Text>
                <View style={[styles.estadoBadge, { backgroundColor: venta.estado === "pagado" ? "#E6FFE6" : "#FFF0E6" }]}>
                  <Text style={[styles.estadoText, { color: venta.estado === "pagado" ? "#1A8C1A" : "#C05A00" }]}>
                    {venta.estado === "pagado" ? "PAGADO" : "PENDIENTE"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      {/* ── Modal editar negocio ─────────────────────────── */}
      <Modal visible={modalEditar} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={() => setModalEditar(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Perfil del negocio</Text>
                    <TouchableOpacity
                      onPress={() => setModalEditar(false)}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={20} color="#555" />
                    </TouchableOpacity>
                  </View>

                  {/* Foto */}
                  <TouchableOpacity style={styles.fotoWrap} onPress={seleccionarFoto}>
                    <View style={styles.fotoCirculo}>
                      {editFoto ? (
                        <Image source={{ uri: editFoto }} style={styles.fotoPreview} />
                      ) : (
                        <>
                          <Ionicons name="storefront-outline" size={36} color="#1A56FF" />
                          <Text style={styles.fotoTexto}>Agregar foto</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.fotoBadge}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  </TouchableOpacity>

                  {editFoto && (
                    <TouchableOpacity
                      onPress={() => setEditFoto(null)}
                      style={styles.quitarFotoBtn}
                    >
                      <Text style={styles.quitarFotoText}>Quitar foto</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.modalLabel}>Nombre del negocio</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="storefront-outline" size={18} color="#aaa" />
                    <TextInput
                      style={styles.input}
                      value={editNombre}
                      onChangeText={setEditNombre}
                      placeholder="Ej: Tienda Don Luis"
                      placeholderTextColor="#bbb"
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.guardarBtn, guardando && { opacity: 0.7 }]}
                    onPress={guardarPerfil}
                    disabled={guardando}
                  >
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.guardarBtnText}>
                      {guardando ? "Guardando..." : "Guardar"}
                    </Text>
                  </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#1A56FF" },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1A56FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A56FF", flex: 1 },

  cardVentas: {
    backgroundColor: "#1A56FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardVentasIcon: { position: "absolute", right: 16, top: 16 },
  cardVentasLabel: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 4 },
  cardVentasMonto: { color: "#fff", fontSize: 32, fontWeight: "700", marginBottom: 8 },
  cardVentasBadge: { flexDirection: "row", alignItems: "center" },
  cardVentasBadgeText: { fontSize: 13, fontWeight: "600" },

  cardCobros: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCobrosTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardCobrosLabel: { fontSize: 14, color: "#555", marginBottom: 4 },
  cardCobrosMonto: { fontSize: 28, fontWeight: "700", color: "#E53E3E" },
  cardCobrosIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFE8E8", alignItems: "center", justifyContent: "center" },
  progressBar: { height: 6, backgroundColor: "#F0F0F0", borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: "#E53E3E", borderRadius: 3 },
  cardCobrosSubtitle: { fontSize: 13, color: "#888" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 12 },
  accionesRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  accionBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: "center", gap: 10 },
  accionIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  accionLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  actividadHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  verTodo: { color: "#1A56FF", fontSize: 14, fontWeight: "600" },

  actividadItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#F0F0F0", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actividadIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center", marginRight: 12 },
  actividadInfo: { flex: 1 },
  actividadNombre: { fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 3 },
  actividadTiempo: { fontSize: 12, color: "#888" },
  actividadRight: { alignItems: "flex-end", gap: 4 },
  actividadMonto: { fontSize: 15, fontWeight: "700" },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  estadoText: { fontSize: 11, fontWeight: "700" },

  emptyActividad: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyActividadText: { fontSize: 14, color: "#aaa" },

  fab: { position: "absolute", bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#1A56FF", alignItems: "center", justifyContent: "center", shadowColor: "#1A56FF", shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },

  fotoWrap: { alignSelf: "center", marginBottom: 8, position: "relative" },
  fotoCirculo: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", gap: 4, overflow: "hidden" },
  fotoPreview: { width: 90, height: 90, borderRadius: 45 },
  fotoTexto: { fontSize: 11, color: "#1A56FF", fontWeight: "600" },
  fotoBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: "#1A56FF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },

  quitarFotoBtn: { alignSelf: "center", marginBottom: 16 },
  quitarFotoText: { fontSize: 13, color: "#E53E3E", fontWeight: "600" },

  modalLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 8, marginTop: 16 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10, marginBottom: 24 },
  input: { flex: 1, fontSize: 15, color: "#111" },

  guardarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1A56FF", borderRadius: 14, padding: 16, gap: 8 },
  guardarBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});