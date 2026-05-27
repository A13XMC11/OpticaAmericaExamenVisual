// Exportación de fichas a PDF usando @react-pdf/renderer
// Se importa dinámicamente desde FichaTimeline para evitar SSR issues

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 },
  brand: { fontSize: 14, fontWeight: "bold" },
  brandBlue: { color: "#1d4ed8" },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 7, fontWeight: "bold", textTransform: "uppercase", color: "#6b7280", marginBottom: 3 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { fontWeight: "bold", marginRight: 3 },
  table: { borderTop: "1px solid #d1d5db", borderLeft: "1px solid #d1d5db" },
  th: { backgroundColor: "#f9fafb", padding: "3 5", borderRight: "1px solid #d1d5db", borderBottom: "1px solid #d1d5db", fontSize: 7, fontWeight: "bold", textAlign: "center" },
  td: { padding: "3 5", borderRight: "1px solid #d1d5db", borderBottom: "1px solid #d1d5db", textAlign: "center" },
  eyeLabel: { backgroundColor: "#f9fafb", fontWeight: "bold" },
  divider: { borderBottom: "1px solid #e5e7eb", marginVertical: 6 },
  firma: { marginTop: 20, alignItems: "flex-end" },
  firmaLine: { borderBottom: "1px solid #9ca3af", width: 120, marginBottom: 3 },
});

interface Medicion {
  seccion: string;
  ojo: string;
  esfera?: string;
  cilindro?: string;
  eje?: string;
  adicion?: string;
  av?: string;
  avSinLentes?: string;
  avConLentes?: string;
  binocular?: string;
  dp?: string;
}

interface FichaData {
  id: string;
  fecha: string;
  edadSnapshot?: number | null;
  ultimoExamenVisual?: string | null;
  realizadoById: string;
  motivoControl: boolean;
  motivoNoVeLejos: boolean;
  motivoNoVeCerca: boolean;
  motivoCefalea: boolean;
  motivoHiperemia: boolean;
  motivoOtros?: string | null;
  antDiabetes: boolean;
  antHipertension: boolean;
  antGlaucoma: boolean;
  antCirugia: boolean;
  lentesDesde?: number | null;
  antecedentesOtros?: string | null;
  oftalmoscopia?: string | null;
  queratometria?: string | null;
  otros?: string | null;
  proximoControl?: string | null;
  mediciones: Medicion[];
  paciente: { nombre: string; apellido: string; cedula: string; telefono?: string | null; ocupacion?: string | null };
}

function getMed(meds: Medicion[], seccion: string, ojo: string) {
  return meds.find((m) => m.seccion === seccion && m.ojo === ojo);
}

function boolList(items: { label: string; val: boolean }[]): string {
  return items.filter((i) => i.val).map((i) => i.label).join(", ") || "—";
}

function PDFTable({ label, meds, seccion, cols }: {
  label: string;
  meds: Medicion[];
  seccion: string;
  cols: { key: keyof Medicion; label: string }[];
}) {
  const colW = `${80 / cols.length}%`;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <View style={[styles.th, { width: "8%" }]}><Text> </Text></View>
          {cols.map((c) => <View key={c.key} style={[styles.th, { width: colW }]}><Text>{c.label}</Text></View>)}
        </View>
        {["OD", "OI"].map((ojo) => {
          const m = getMed(meds, seccion, ojo);
          return (
            <View key={ojo} style={styles.row}>
              <View style={[styles.td, styles.eyeLabel, { width: "8%" }]}><Text>{ojo}</Text></View>
              {cols.map((c) => (
                <View key={c.key} style={[styles.td, { width: colW }]}>
                  <Text>{(m?.[c.key] as string) ?? ""}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FichaPDF({ ficha }: { ficha: FichaData }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>
            <Text style={styles.brandBlue}>óptica</Text>
            <Text>américa</Text>
          </Text>
          <Text style={{ fontSize: 6, color: "#9ca3af" }}>desde 1982</Text>
        </View>
        <View style={{ textAlign: "right" }}>
          <Text>Fecha: {format(new Date(ficha.fecha), "dd/MM/yyyy", { locale: es })}</Text>
        </View>
      </View>

      <View style={[styles.section, styles.row]}>
        <Text style={styles.label}>Paciente:</Text>
        <Text>{ficha.paciente.nombre} {ficha.paciente.apellido}</Text>
        <Text style={[styles.label, { marginLeft: 12 }]}>Cédula:</Text>
        <Text>{ficha.paciente.cedula}</Text>
        {ficha.edadSnapshot && <><Text style={[styles.label, { marginLeft: 12 }]}>Edad:</Text><Text>{ficha.edadSnapshot}</Text></>}
      </View>

      <View style={[styles.section]}>
        <Text><Text style={styles.label}>Motivo: </Text>
          {boolList([
            { label: "Control", val: ficha.motivoControl },
            { label: "No ve lejos", val: ficha.motivoNoVeLejos },
            { label: "No ve cerca", val: ficha.motivoNoVeCerca },
            { label: "Cefalea", val: ficha.motivoCefalea },
            { label: "Hiperemia", val: ficha.motivoHiperemia },
          ])}
          {ficha.motivoOtros ? `, ${ficha.motivoOtros}` : ""}
        </Text>
      </View>

      <View style={[styles.section]}>
        <Text><Text style={styles.label}>Antecedentes: </Text>
          {boolList([
            { label: "Diabetes", val: ficha.antDiabetes },
            { label: "Hipertensión", val: ficha.antHipertension },
            { label: "Glaucoma", val: ficha.antGlaucoma },
            { label: "Cirugía", val: ficha.antCirugia },
          ])}
          {ficha.lentesDesde ? `, Lentes desde ${ficha.lentesDesde}` : ""}
        </Text>
      </View>

      <View style={styles.divider} />

      <PDFTable label="Lentes en uso" meds={ficha.mediciones} seccion="LENTES_USO"
        cols={[
          { key: "esfera", label: "Esfera" }, { key: "cilindro", label: "Cilindro" },
          { key: "eje", label: "Eje" }, { key: "adicion", label: "Adición" },
          { key: "avSinLentes", label: "AV s/L" }, { key: "avConLentes", label: "AV c/L" },
        ]}
      />

      <PDFTable label="Retinoscopia" meds={ficha.mediciones} seccion="RETINOSCOPIA"
        cols={[{ key: "esfera", label: "Esfera" }, { key: "cilindro", label: "Cilindro" }, { key: "eje", label: "Eje" }]}
      />

      {(ficha.oftalmoscopia || ficha.queratometria) && (
        <View style={styles.section}>
          {ficha.oftalmoscopia && <Text><Text style={styles.label}>Oftalmoscopia: </Text>{ficha.oftalmoscopia}</Text>}
          {ficha.queratometria && <Text><Text style={styles.label}>Queratometría: </Text>{ficha.queratometria}</Text>}
        </View>
      )}

      <PDFTable label="Receta Final" meds={ficha.mediciones} seccion="RECETA_FINAL"
        cols={[
          { key: "esfera", label: "Esfera" }, { key: "cilindro", label: "Cilindro" },
          { key: "eje", label: "Eje" }, { key: "av", label: "A.V." },
          { key: "binocular", label: "Binocular" }, { key: "adicion", label: "Adición" }, { key: "dp", label: "D.P." },
        ]}
      />

      {ficha.otros && <View style={styles.section}><Text><Text style={styles.label}>Otros: </Text>{ficha.otros}</Text></View>}

      <View style={styles.firma}>
        <View style={styles.firmaLine} />
        <Text>Realizado por</Text>
      </View>

      {ficha.proximoControl && (
        <Text style={{ marginTop: 8, textAlign: "center", color: "#6b7280" }}>
          Próximo control: {format(new Date(ficha.proximoControl), "dd/MM/yyyy", { locale: es })}
        </Text>
      )}
    </Page>
  );
}

export async function exportFichasPDF(fichaIds: string[]) {
  const fichas = await Promise.all(
    fichaIds.map((id) =>
      fetch(`/api/fichas/${id}`).then((r) => r.json()).then((j) => j.data as FichaData)
    )
  );

  const doc = (
    <Document>
      {fichas.map((f) => f && <FichaPDF key={f.id} ficha={f} />)}
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fichas-optica-america-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
