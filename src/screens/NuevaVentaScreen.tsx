// src/screens/NuevaVentaScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { obtenerProductos } from "../database/inventarioDB";
import { obtenerClientes } from "../database/clientesDB";
import { crearVenta } from "../database/ventasDB";
import { Producto, Cliente } from "../types";

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

// ── Helper avatar ─────────────────────────────────────
function AvatarCliente({ cliente, size = 40 }: { cliente: Cliente; size?: number }) {
  const iniciales = cliente.nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (cliente.foto_uri) {
    return (
      <Image
        source={{ uri: cliente.foto_uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#EEF0FF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.35, fontWeight: "700", color: "#1A56FF" }}>
        {iniciales}
      </Text>
    </View>
  );
}

export default function NuevaVentaScreen({ navigation }: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [tipoPago, setTipoPago] = useState<"efectivo" | "transferencia" | "credito">("efectivo");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [modalCliente, setModalCliente] = useState(false);
  const [modalResumen, setModalResumen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setProductos(obtenerProductos());
      setClientes(obtenerClientes());
    }, []),
  );

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      p.stock > 0,
  );

  const agregarAlCarrito = (producto: Producto) => {
    const existe = carrito.find((i) => i.producto.id === producto.id);
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        Alert.alert("Sin stock", `Solo hay ${producto.stock} unidades disponibles`);
        return;
      }
      setCarrito(carrito.map((i) =>
        i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
      ));
    } else {
      setCarrito([...carrito, { producto, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (productoId: number) => {
    const existe = carrito.find((i) => i.producto.id === productoId);
    if (existe && existe.cantidad > 1) {
      setCarrito(carrito.map((i) =>
        i.producto.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i,
      ));
    } else {
      setCarrito(carrito.filter((i) => i.producto.id !== productoId));
    }
  };

  const getCantidadEnCarrito = (productoId: number) =>
    carrito.find((i) => i.producto.id === productoId)?.cantidad ?? 0;

  const total = carrito.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0);

  const confirmarVenta = () => {
    if (carrito.length === 0) {
      Alert.alert("Error", "Agrega al menos un producto");
      return;
    }
    if (tipoPago === "credito") {
      if (!clienteSeleccionado) {
        Alert.alert("Error", "Selecciona un cliente para ventas a crédito");
        return;
      }
      const creditoDisponible = clienteSeleccionado.limite_credito - clienteSeleccionado.saldo_deuda;
      if (total > creditoDisponible) {
        Alert.alert(
          "⚠️ Límite de crédito insuficiente",
          `Este cliente no tiene suficiente crédito disponible para esta compra.\n\n` +
            `• Total de la compra: $${total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}\n` +
            `• Crédito disponible: $${creditoDisponible.toLocaleString("es-CO", { minimumFractionDigits: 2 })}\n` +
            `• Deuda actual: $${clienteSeleccionado.saldo_deuda.toLocaleString("es-CO", { minimumFractionDigits: 2 })}\n` +
            `• Límite máximo: $${clienteSeleccionado.limite_credito.toLocaleString("es-CO", { minimumFractionDigits: 2 })}\n\n` +
            `Reduce los productos del carrito o solicita pago en efectivo / transferencia.`,
        );
        return;
      }
    }
    setModalResumen(true);
  };

  const procesarVenta = () => {
    setGuardando(true);
    try {
      crearVenta(
        clienteSeleccionado?.id ?? null,
        total,
        tipoPago,
        carrito.map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
          precioUnitario: i.producto.precio,
        })),
      );
      setModalResumen(false);
      Alert.alert(
        "¡Venta registrada!",
        `Total: $${total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
        [{
          text: "OK",
          onPress: () => {
            setCarrito([]);
            setClienteSeleccionado(null);
            setTipoPago("efectivo");
            navigation.goBack();
          },
        }],
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo registrar la venta");
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
        <Text style={styles.headerTitle}>Nueva Venta</Text>
        {carrito.length > 0 && (
          <View style={styles.carritoCount}>
            <Text style={styles.carritoCountText}>{carrito.length}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cliente */}
        <Text style={styles.sectionTitle}>Cliente (opcional)</Text>
        <TouchableOpacity
          style={styles.clienteSelector}
          onPress={() => setModalCliente(true)}
        >
          {clienteSeleccionado ? (
            <View style={styles.clienteSelectorActivo}>
              {/* ← foto o iniciales */}
              <AvatarCliente cliente={clienteSeleccionado} size={40} />
              <View style={styles.clienteInfo}>
                <Text style={styles.clienteNombre}>{clienteSeleccionado.nombre}</Text>
                <Text style={styles.clienteDeuda}>
                  Deuda: ${clienteSeleccionado.saldo_deuda.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setClienteSeleccionado(null)}>
                <Ionicons name="close-circle" size={22} color="#888" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.clienteSelectorVacio}>
              <Ionicons name="person-add-outline" size={20} color="#888" />
              <Text style={styles.clienteSelectorTexto}>Seleccionar cliente</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
          )}
        </TouchableOpacity>

        {/* Tipo de pago */}
        <Text style={styles.sectionTitle}>Tipo de pago</Text>
        <View style={styles.tiposPagoRow}>
          {([
            { key: "efectivo", label: "Efectivo", icon: "cash-outline" },
            { key: "transferencia", label: "Transferencia", icon: "phone-portrait-outline" },
            { key: "credito", label: "Crédito", icon: "time-outline" },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tipoPagoBadge, tipoPago === t.key && styles.tipoPagoBadgeActivo]}
              onPress={() => setTipoPago(t.key)}
            >
              <Ionicons name={t.icon} size={18} color={tipoPago === t.key ? "#fff" : "#555"} />
              <Text style={[styles.tipoPagoText, tipoPago === t.key && styles.tipoPagoTextActivo]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Productos */}
        <Text style={styles.sectionTitle}>Productos</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor="#aaa"
            value={busquedaProducto}
            onChangeText={setBusquedaProducto}
          />
        </View>

        {productosFiltrados.length === 0 ? (
          <View style={styles.emptyProductos}>
            <Ionicons name="cube-outline" size={36} color="#ddd" />
            <Text style={styles.emptyProductosText}>
              {productos.length === 0 ? "No tienes productos en inventario" : "No se encontraron productos"}
            </Text>
          </View>
        ) : (
          productosFiltrados.map((producto) => {
            const cantidad = getCantidadEnCarrito(producto.id);
            return (
              <View key={producto.id} style={styles.productoItem}>
                <View style={styles.productoImgPlaceholder}>
                  {producto.foto_uri ? (
                    <Image source={{ uri: producto.foto_uri }} style={{ width: 44, height: 44, borderRadius: 8 }} />
                  ) : (
                    <Ionicons name="cube-outline" size={24} color="#ccc" />
                  )}
                </View>
                <View style={styles.productoInfo}>
                  <Text style={styles.productoNombre}>{producto.nombre}</Text>
                  <Text style={styles.productoPrecio}>
                    ${producto.precio.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.productoStock}>Stock: {producto.stock}</Text>
                </View>
                <View style={styles.cantidadControl}>
                  {cantidad > 0 ? (
                    <>
                      <TouchableOpacity style={styles.cantidadBtn} onPress={() => quitarDelCarrito(producto.id)}>
                        <Ionicons name="remove" size={18} color="#333" />
                      </TouchableOpacity>
                      <Text style={styles.cantidadNum}>{cantidad}</Text>
                    </>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.cantidadBtn, styles.cantidadBtnAdd]}
                    onPress={() => agregarAlCarrito(producto)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Carrito resumen */}
        {carrito.length > 0 && (
          <View style={styles.carritoResumen}>
            <Text style={styles.carritoResumenTitle}>Resumen del carrito</Text>
            {carrito.map((item) => (
              <View key={item.producto.id} style={styles.carritoItem}>
                <Text style={styles.carritoItemNombre}>{item.cantidad}x {item.producto.nombre}</Text>
                <Text style={styles.carritoItemTotal}>
                  ${(item.producto.precio * item.cantidad).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
            <View style={styles.carritoTotalRow}>
              <Text style={styles.carritoTotalLabel}>TOTAL</Text>
              <Text style={styles.carritoTotal}>
                ${total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Botón confirmar */}
      {carrito.length > 0 && (
        <View style={styles.footerBtn}>
          <TouchableOpacity style={styles.confirmarBtn} onPress={confirmarVenta}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.confirmarBtnText}>
              Confirmar Venta · ${total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal seleccionar cliente */}
      <Modal visible={modalCliente} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setModalCliente(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={clientes}
              keyExtractor={(c) => String(c.id)}
              style={{ maxHeight: 400 }}
              ListEmptyComponent={
                <View style={styles.emptyProductos}>
                  <Text style={styles.emptyProductosText}>No hay clientes registrados</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clienteModalItem}
                  onPress={() => {
                    setClienteSeleccionado(item);
                    setModalCliente(false);
                  }}
                >
                  {/* ← foto o iniciales en el modal */}
                  <AvatarCliente cliente={item} size={42} />
                  <View style={styles.clienteInfo}>
                    <Text style={styles.clienteNombre}>{item.nombre}</Text>
                    <Text style={styles.clienteDeuda}>
                      Deuda: ${item.saldo_deuda.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal resumen venta */}
      <Modal visible={modalResumen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar Venta</Text>
              <TouchableOpacity onPress={() => setModalResumen(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {clienteSeleccionado && (
              <View style={styles.resumenCliente}>
                {/* ← foto en el resumen también */}
                <AvatarCliente cliente={clienteSeleccionado} size={32} />
                <Text style={styles.resumenClienteNombre}>{clienteSeleccionado.nombre}</Text>
              </View>
            )}

            <View style={styles.resumenTipoPago}>
              <Ionicons name="card-outline" size={16} color="#555" />
              <Text style={styles.resumenTipoPagoText}>
                {tipoPago.charAt(0).toUpperCase() + tipoPago.slice(1)}
              </Text>
            </View>

            {carrito.map((item) => (
              <View key={item.producto.id} style={styles.carritoItem}>
                <Text style={styles.carritoItemNombre}>{item.cantidad}x {item.producto.nombre}</Text>
                <Text style={styles.carritoItemTotal}>
                  ${(item.producto.precio * item.cantidad).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}

            <View style={styles.carritoTotalRow}>
              <Text style={styles.carritoTotalLabel}>TOTAL</Text>
              <Text style={styles.carritoTotal}>
                ${total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmarBtn, { marginTop: 16 }, guardando && { opacity: 0.7 }]}
              onPress={procesarVenta}
              disabled={guardando}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmarBtnText}>
                {guardando ? "Procesando..." : "Procesar Venta"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#111", textAlign: "center" },
  carritoCount: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1A56FF", alignItems: "center", justifyContent: "center" },
  carritoCountText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginTop: 16, marginBottom: 10 },

  clienteSelector: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#F0F0F0", marginBottom: 4, overflow: "hidden" },
  clienteSelectorVacio: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  clienteSelectorTexto: { flex: 1, fontSize: 15, color: "#888" },
  clienteSelectorActivo: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  clienteInfo: { flex: 1 },
  clienteNombre: { fontSize: 15, fontWeight: "700", color: "#111" },
  clienteDeuda: { fontSize: 12, color: "#888" },

  tiposPagoRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tipoPagoBadge: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", gap: 4 },
  tipoPagoBadgeActivo: { backgroundColor: "#1A56FF", borderColor: "#1A56FF" },
  tipoPagoText: { fontSize: 12, fontWeight: "600", color: "#555" },
  tipoPagoTextActivo: { color: "#fff" },

  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, height: 42, borderWidth: 1, borderColor: "#F0F0F0", gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },

  productoItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#F0F0F0" },
  productoImgPlaceholder: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center", marginRight: 12 },
  productoInfo: { flex: 1 },
  productoNombre: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  productoPrecio: { fontSize: 14, fontWeight: "700", color: "#1A56FF", marginBottom: 2 },
  productoStock: { fontSize: 11, color: "#888" },
  cantidadControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  cantidadBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  cantidadBtnAdd: { backgroundColor: "#1A56FF" },
  cantidadNum: { fontSize: 16, fontWeight: "700", color: "#111", minWidth: 20, textAlign: "center" },

  carritoResumen: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#F0F0F0" },
  carritoResumenTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 12 },
  carritoItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  carritoItemNombre: { fontSize: 14, color: "#555", flex: 1 },
  carritoItemTotal: { fontSize: 14, fontWeight: "600", color: "#111" },
  carritoTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 12, marginTop: 4 },
  carritoTotalLabel: { fontSize: 13, fontWeight: "700", color: "#888" },
  carritoTotal: { fontSize: 20, fontWeight: "700", color: "#1A56FF" },

  footerBtn: { padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  confirmarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1A56FF", borderRadius: 14, padding: 16, gap: 8 },
  confirmarBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  emptyProductos: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyProductosText: { fontSize: 14, color: "#aaa" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

  clienteModalItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0", gap: 12 },

  resumenCliente: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, backgroundColor: "#EEF0FF", padding: 10, borderRadius: 8 },
  resumenClienteNombre: { fontSize: 14, fontWeight: "600", color: "#1A56FF", flex: 1 },
  resumenTipoPago: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  resumenTipoPagoText: { fontSize: 14, color: "#555" },
});