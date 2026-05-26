// src/screens/HistorialScreen.tsx
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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  obtenerVentas,
  obtenerTotalHoy,
  obtenerItemsVenta,
} from "../database/ventasDB";

type FiltroVenta = "Todas" | "Pagadas" | "Pendientes";

export default function HistorialScreen() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<FiltroVenta>("Todas");
  const [totalHoy, setTotalHoy] = useState(0);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any | null>(null);
  const [itemsVenta, setItemsVenta] = useState<any[]>([]);
  const [modalDetalle, setModalDetalle] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const data = obtenerVentas();
      setVentas(data);
      setTotalHoy(obtenerTotalHoy());
    }, []),
  );

  const abrirDetalle = (venta: any) => {
    const items = obtenerItemsVenta(venta.id);
    setItemsVenta(items);
    setVentaSeleccionada(venta);
    setModalDetalle(true);
  };

  const cerrarDetalle = () => {
    setModalDetalle(false);
    setVentaSeleccionada(null);
    setItemsVenta([]);
  };

  const ventasFiltradas = ventas.filter((v) => {
    if (filtro === "Todas") return true;
    if (filtro === "Pagadas") return v.estado === "pagado";
    return v.estado === "pendiente";
  });

  const totalPendiente = ventas
    .filter((v) => v.estado === "pendiente")
    .reduce((acc, v) => acc + v.total, 0);

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
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFechaDetalle = (fecha: string) => {
    const d = parseFecha(fecha);
    if (!d) return { fecha: "Fecha no disponible", hora: "—" };
    return {
      fecha: d.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      hora: d.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const iconoPorTipo = (tipoPago: string) => {
    if (tipoPago === "efectivo")
      return { name: "cash-outline", color: "#1A8C1A" };
    if (tipoPago === "transferencia")
      return { name: "phone-portrait-outline", color: "#1A56FF" };
    return { name: "time-outline", color: "#E53E3E" };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="search" size={22} color="#1A56FF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#1A56FF" }]}>
          <Text style={styles.statLabelBlue}>VENTAS HOY</Text>
          <Text style={styles.statMontoBlue}>
            ${totalHoy.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: "#FFF0F0",
              borderWidth: 1,
              borderColor: "#FFD0D0",
            },
          ]}
        >
          <Text style={styles.statLabelRed}>POR COBRAR</Text>
          <Text style={styles.statMontoRed}>
            $
            {totalPendiente.toLocaleString("es-CO", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        {(["Todas", "Pagadas", "Pendientes"] as FiltroVenta[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filtroBadge,
              filtro === f && styles.filtroBadgeActivo,
            ]}
            onPress={() => setFiltro(f)}
          >
            <Text
              style={[
                styles.filtroText,
                filtro === f && styles.filtroTextActivo,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {ventasFiltradas.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={52} color="#ddd" />
            <Text style={styles.emptyText}>
              {ventas.length === 0
                ? "Aún no hay ventas registradas"
                : "No hay ventas en este filtro"}
            </Text>
          </View>
        ) : (
          ventasFiltradas.map((venta) => {
            const icono = iconoPorTipo(venta.tipo_pago);

            console.log("fecha raw:", JSON.stringify(venta.created_at));
            return (
              <TouchableOpacity
                key={venta.id}
                style={styles.ventaCard}
                onPress={() => abrirDetalle(venta)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.ventaIconWrap,
                    { backgroundColor: icono.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={icono.name as any}
                    size={22}
                    color={icono.color}
                  />
                </View>
                <View style={styles.ventaInfo}>
                  <Text style={styles.ventaCliente}>
                    {venta.cliente_nombre || "Venta directa"}
                  </Text>
                  <Text style={styles.ventaFecha}>
                    {formatFecha(venta.created_at)}
                  </Text>
                  <View style={styles.ventaMetodoRow}>
                    <Ionicons
                      name={icono.name as any}
                      size={12}
                      color={icono.color}
                    />
                    <Text style={[styles.ventaMetodo, { color: icono.color }]}>
                      {venta.tipo_pago.charAt(0).toUpperCase() +
                        venta.tipo_pago.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.ventaRight}>
                  <Text style={styles.ventaMonto}>
                    $
                    {venta.total.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                  <View
                    style={[
                      styles.estadoBadge,
                      {
                        backgroundColor:
                          venta.estado === "pagado" ? "#E6FFE6" : "#FFF0E6",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.estadoText,
                        {
                          color:
                            venta.estado === "pagado" ? "#1A8C1A" : "#C05A00",
                        },
                      ]}
                    >
                      {venta.estado === "pagado" ? "PAGADO" : "PENDIENTE"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#ccc" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal detalle venta */}
      <Modal visible={modalDetalle} transparent animationType="fade">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={cerrarDetalle}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  {/* Modal header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleWrap}>
                      <Ionicons
                        name="receipt-outline"
                        size={20}
                        color="#1A56FF"
                      />
                      <Text style={styles.modalTitle}>Detalle de Venta</Text>
                    </View>
                    <TouchableOpacity
                      onPress={cerrarDetalle}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={22} color="#555" />
                    </TouchableOpacity>
                  </View>

                  {ventaSeleccionada &&
                    (() => {
                      const icono = iconoPorTipo(ventaSeleccionada.tipo_pago);
                      const { fecha, hora } = formatFechaDetalle(
                        ventaSeleccionada.created_at,
                      );
                      const esPagado = ventaSeleccionada.estado === "pagado";
                      return (
                        <>
                          {/* Estado badge grande */}
                          <View
                            style={[
                              styles.estadoGrandeBadge,
                              {
                                backgroundColor: esPagado
                                  ? "#E6FFE6"
                                  : "#FFF0E6",
                              },
                            ]}
                          >
                            <Ionicons
                              name={esPagado ? "checkmark-circle" : "time"}
                              size={16}
                              color={esPagado ? "#1A8C1A" : "#C05A00"}
                            />
                            <Text
                              style={[
                                styles.estadoGrandeText,
                                { color: esPagado ? "#1A8C1A" : "#C05A00" },
                              ]}
                            >
                              {esPagado ? "Pagado" : "Pendiente de pago"}
                            </Text>
                          </View>

                          {/* Fecha y hora */}
                          <View style={styles.detalleSeccion}>
                            <View style={styles.detalleRow}>
                              <View style={styles.detalleRowLeft}>
                                <Ionicons
                                  name="calendar-outline"
                                  size={16}
                                  color="#888"
                                />
                                <Text style={styles.detalleLabel}>Fecha</Text>
                              </View>
                              <Text style={styles.detalleValor}>{fecha}</Text>
                            </View>
                            <View style={styles.detalleRow}>
                              <View style={styles.detalleRowLeft}>
                                <Ionicons
                                  name="time-outline"
                                  size={16}
                                  color="#888"
                                />
                                <Text style={styles.detalleLabel}>Hora</Text>
                              </View>
                              <Text style={styles.detalleValor}>{hora}</Text>
                            </View>
                            <View style={styles.detalleRow}>
                              <View style={styles.detalleRowLeft}>
                                <Ionicons
                                  name={icono.name as any}
                                  size={16}
                                  color="#888"
                                />
                                <Text style={styles.detalleLabel}>Pago</Text>
                              </View>
                              <View
                                style={[
                                  styles.tipoPagoBadge,
                                  { backgroundColor: icono.color + "18" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.tipoPagoText,
                                    { color: icono.color },
                                  ]}
                                >
                                  {ventaSeleccionada.tipo_pago
                                    .charAt(0)
                                    .toUpperCase() +
                                    ventaSeleccionada.tipo_pago.slice(1)}
                                </Text>
                              </View>
                            </View>
                            {ventaSeleccionada.cliente_nombre && (
                              <View style={styles.detalleRow}>
                                <View style={styles.detalleRowLeft}>
                                  <Ionicons
                                    name="person-outline"
                                    size={16}
                                    color="#888"
                                  />
                                  <Text style={styles.detalleLabel}>
                                    Cliente
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.detalleValor,
                                    { color: "#1A56FF", fontWeight: "700" },
                                  ]}
                                >
                                  {ventaSeleccionada.cliente_nombre}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Productos */}
                          <Text style={styles.productosTitle}>
                            Productos vendidos
                          </Text>
                          <View style={styles.productosWrap}>
                            {itemsVenta.length === 0 ? (
                              <Text style={styles.sinItems}>
                                Sin detalle de productos
                              </Text>
                            ) : (
                              itemsVenta.map((item, index) => (
                                <View
                                  key={index}
                                  style={[
                                    styles.itemRow,
                                    index < itemsVenta.length - 1 &&
                                      styles.itemRowBorder,
                                  ]}
                                >
                                  <View style={styles.itemIconWrap}>
                                    <Ionicons
                                      name="cube-outline"
                                      size={16}
                                      color="#1A56FF"
                                    />
                                  </View>
                                  <View style={styles.itemInfo}>
                                    <Text style={styles.itemNombre}>
                                      {item.producto_nombre}
                                    </Text>
                                    <Text style={styles.itemPrecioUnit}>
                                      $
                                      {item.precio_unitario.toLocaleString(
                                        "es-CO",
                                        { minimumFractionDigits: 2 },
                                      )}{" "}
                                      c/u
                                    </Text>
                                  </View>
                                  <View style={styles.itemRight}>
                                    <Text style={styles.itemCantidad}>
                                      ×{item.cantidad}
                                    </Text>
                                    <Text style={styles.itemSubtotal}>
                                      $
                                      {(
                                        item.precio_unitario * item.cantidad
                                      ).toLocaleString("es-CO", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </Text>
                                  </View>
                                </View>
                              ))
                            )}
                          </View>

                          {/* Total */}
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalMonto}>
                              $
                              {ventaSeleccionada.total.toLocaleString("es-CO", {
                                minimumFractionDigits: 2,
                              })}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111" },
  headerBtn: { padding: 4 },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statCard: { flex: 1, borderRadius: 14, padding: 14 },
  statLabelBlue: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statMontoBlue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLabelRed: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E53E3E",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statMontoRed: { fontSize: 18, fontWeight: "700", color: "#E53E3E" },

  filtrosRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filtroBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  filtroBadgeActivo: { backgroundColor: "#1A56FF", borderColor: "#1A56FF" },
  filtroText: { fontSize: 13, color: "#555", fontWeight: "500" },
  filtroTextActivo: { color: "#fff", fontWeight: "700" },

  ventaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  ventaIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  ventaInfo: { flex: 1, gap: 3 },
  ventaCliente: { fontSize: 15, fontWeight: "700", color: "#111" },
  ventaFecha: { fontSize: 12, color: "#888" },
  ventaMetodoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ventaMetodo: { fontSize: 12, fontWeight: "600" },
  ventaRight: { alignItems: "flex-end", gap: 6 },
  ventaMonto: { fontSize: 16, fontWeight: "700", color: "#111" },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  estadoText: { fontSize: 11, fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#aaa", fontWeight: "500" },

  // ── Modal detalle ──────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 22 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  estadoGrandeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  estadoGrandeText: { fontSize: 13, fontWeight: "700" },

  detalleSeccion: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  detalleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detalleRowLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  detalleLabel: { fontSize: 13, color: "#888" },
  detalleValor: { fontSize: 13, fontWeight: "600", color: "#111" },
  tipoPagoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tipoPagoText: { fontSize: 12, fontWeight: "700" },

  productosTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  productosWrap: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sinItems: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  itemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemNombre: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  itemPrecioUnit: { fontSize: 11, color: "#888" },
  itemRight: { alignItems: "flex-end", gap: 2 },
  itemCantidad: { fontSize: 12, color: "#888" },
  itemSubtotal: { fontSize: 13, fontWeight: "700", color: "#111" },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 14,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#888" },
  totalMonto: { fontSize: 22, fontWeight: "700", color: "#1A56FF" },
});
