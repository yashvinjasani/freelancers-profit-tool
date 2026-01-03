import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import axios from 'axios';

// REPLACE WITH YOUR COMPUTER'S LOCAL IP ADDRESS
const API_URL = 'http://192.168.1.130:5000'; 

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'add'
  const [dashboardData, setDashboardData] = useState([]);
  
  // Form State
  const [client, setClient] = useState('');
  const [hours, setHours] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Billable'); // 'Billable' or 'Admin'

  useEffect(() => {
    fetchDashboard();
  }, [view]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (hours) {
        await axios.post(`${API_URL}/add-time`, { 
            Client: client, Hours: parseFloat(hours), Type: type 
        });
      }
      if (amount) {
        await axios.post(`${API_URL}/add-income`, { 
            Client: client, Amount: parseFloat(amount) 
        });
      }
      Alert.alert("Success", "Data Logged!");
      setClient(''); setHours(''); setAmount('');
      setView('dashboard');
    } catch (error) {
      Alert.alert("Error", "Could not connect to server");
    }
  };

  const renderDashboardItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.Client}</Text>
        <Text style={styles.rhr}>${item.Real_Hourly_Rate.toFixed(2)}/hr</Text>
      </View>
      
      <View style={styles.statsRow}>
        <Text style={styles.statLabel}>Revenue: <Text style={styles.statValue}>${item.Revenue}</Text></Text>
        <Text style={styles.statLabel}>Hours: <Text style={styles.statValue}>{item.Total_Hours}</Text></Text>
      </View>

      <View style={styles.frictionContainer}>
        <Text style={styles.statLabel}>Friction Score (Admin Load):</Text>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.Friction_Score}%`, backgroundColor: item.Friction_Score > 20 ? '#ff4d4d' : '#4caf50' }]} />
        </View>
        <Text style={styles.frictionText}>{item.Friction_Score.toFixed(0)}%</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Freelance Profit Engine</Text>
      </View>

      {view === 'dashboard' ? (
        <View style={styles.content}>
          <FlatList
            data={dashboardData}
            renderItem={renderDashboardItem}
            keyExtractor={(item) => item.Client}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
          <TouchableOpacity style={styles.fab} onPress={() => setView('add')}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Add New Log</Text>
          
          <Text style={styles.label}>Client Name</Text>
          <TextInput style={styles.input} value={client} onChangeText={setClient} placeholder="e.g. Client A" />

          <Text style={styles.label}>Hours Worked (Optional)</Text>
          <TextInput style={styles.input} value={hours} onChangeText={setHours} keyboardType="numeric" placeholder="e.g. 2.5" />
          
          <View style={styles.typeRow}>
            <TouchableOpacity style={[styles.typeBtn, type === 'Billable' && styles.typeBtnActive]} onPress={() => setType('Billable')}>
                <Text style={styles.typeText}>Billable</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === 'Admin' && styles.typeBtnActive]} onPress={() => setType('Admin')}>
                <Text style={styles.typeText}>Admin (Friction)</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Amount Invoiced (Optional)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 500" />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Save Entry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setView('dashboard')}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#2d3436', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
  rhr: { fontSize: 18, fontWeight: 'bold', color: '#0984e3' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { color: '#636e72', fontSize: 14 },
  statValue: { color: '#2d3436', fontWeight: 'bold' },
  frictionContainer: { marginTop: 10 },
  progressBarBg: { height: 8, backgroundColor: '#dfe6e9', borderRadius: 4, marginVertical: 5 },
  progressBarFill: { height: 8, borderRadius: 4 },
  frictionText: { alignSelf: 'flex-end', fontSize: 12, color: '#636e72' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#0984e3', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontSize: 30, marginTop: -5 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#dfe6e9' },
  label: { marginBottom: 5, color: '#2d3436', fontWeight: '600' },
  submitBtn: { backgroundColor: '#0984e3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  typeRow: { flexDirection: 'row', marginBottom: 15 },
  typeBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#0984e3', alignItems: 'center', marginHorizontal: 5, borderRadius: 5 },
  typeBtnActive: { backgroundColor: '#0984e3' },
  typeText: { color: '#2d3436', fontSize: 12 }
});