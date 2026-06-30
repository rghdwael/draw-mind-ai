import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";

const DOCTORS = [
  { 
    id: "d1", 
    name: "Dr. Shatha Abu Hamda", 
    specialty: "Psychiatry Consultant", 
    clinic: "Shmeisani, Amman", 
    phone: "+962 770 418 500",
    expertise: ["Behavior Analysis", "Anger Management", "Behavioral Therapy"],
    image: require('../../assets/images/IMG-20180727-WA0023_ysSpXBb.jpg'),
    color: "#A78BFA" 
  },
  { 
    id: "d2", 
    name: "Dr. Khaled Bani Hani", 
    specialty: "Psychiatrist & Addiction Expert", 
    clinic: "Al-Khalidi St, Amman", 
    phone: "+962 770 418 500",
    expertise: ["Behavior Analysis", "Psychoanalysis", "Behavioral Therapy"],
    image: require('../../assets/images/IMG_7499_c3UfI1q.jpeg'),
    color: "#FF6B9D" 
  },
  { 
    id: "d3", 
    name: "Dr. Raghad Al-Shunaigat", 
    specialty: "Psychiatrist & Addiction Expert", 
    clinic: "Abdoun, Amman", 
    phone: "+962 770 418 500",
    expertise: ["Behavior Analysis", "Anger Management", "Psychoanalysis"],
    image: require('../../assets/images/رغد_شنيقات_gDCDLuk.jpeg'),
    color: "#48CAE4" 
  },
  { 
    id: "d4", 
    name: "Dr. Mohammed Sawalha", 
    specialty: "Psychiatrist & Addiction Expert", 
    clinic: "4th Circle, Amman", 
    phone: "+962 770 418 500",
    expertise: ["Anger Management", "Psychoanalysis", "Behavioral Therapy"],
    image: require('../../assets/images/دكتور-محمد-صوالحة.jpg'),
    color: "#F8961E" 
  },
  { 
    id: "d5", 
    name: "Dr. Wael Al-Momani", 
    specialty: "Psychiatry Specialist", 
    clinic: "Zarqa", 
    phone: "+962 770 418 500",
    expertise: ["Behavior Analysis", "Anger Management", "Psychoanalysis"],
    image: require('../../assets/images/وائل-المومني.jpeg'),
    color: "#90BE6D" 
  }
];

export default function SpecialistsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.pageTitle}>Specialists</Text>
        <Text style={styles.pageSub}>Connect with certified child psychologists.</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.doctorsScroll, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {DOCTORS.map((doc) => (
          <GlassCard key={doc.id} style={styles.docCard} padding={18}>
            
            {/* Top Row: Avatar and Basic Info */}
            <View style={styles.docHeader}>
              <View style={[styles.imageBorder, { borderColor: doc.color }]}>
                {/* 🚨 Replaced Icon with actual Image component */}
                <Image source={ doc.image } style={styles.docImage} />
              </View>
              
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docSpec}>{doc.specialty}</Text>
                <Text style={styles.docClinic}>{doc.clinic}</Text>
              </View>
            </View>

            {/* Middle Row: Expertise Tags */}
            <View style={styles.expertiseRow}>
              {doc.expertise.map((exp, index) => (
                <View key={index} style={[styles.expertiseBadge, { backgroundColor: doc.color + "15", borderColor: doc.color + "30" }]}>
                  <Text style={[styles.expertiseText, { color: doc.color }]}>{exp}</Text>
                </View>
              ))}
            </View>

            {/* Bottom Row: Contact Info */}
            <View style={styles.phoneRow}>
              <View style={styles.phoneIconWrap}>
                <Ionicons name="call" size={14} color="#7A6090" />
              </View>
              <Text style={styles.phoneText}>{doc.phone}</Text>
            </View>

          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#EDE5FF" },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold" },
  pageSub: { fontSize: 14, color: "#7A6090", fontFamily: "Inter_400Regular", marginTop: 4 },
  doctorsScroll: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  
  docCard: { gap: 14 },
  docHeader: { flexDirection: "row", gap: 14, alignItems: "center" },
  
  // 🚨 New Image Styles
  imageBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  docImage: { 
    width: 56, 
    height: 56, 
    borderRadius: 28,
  },

  docInfo: { flex: 1, gap: 2 },
  docName: { fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  docSpec: { fontSize: 13, color: "#A78BFA", fontFamily: "Inter_600SemiBold" },
  docClinic: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular" },

  expertiseRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  expertiseBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1 
  },
  expertiseText: { fontSize: 11, fontFamily: "Inter_500Medium" },

  phoneRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginTop: 4, 
    paddingTop: 14, 
    borderTopWidth: 1, 
    borderTopColor: "rgba(167, 139, 250, 0.15)" 
  },
  phoneIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  phoneText: { fontSize: 14, color: "#7A6090", fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
});