import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions, Modal, Pressable, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';

// ---------------- CONFIGURATION ----------------
// ⚠️ REPLACE THIS WITH YOUR COMPUTER'S IP ADDRESS FROM 'ipconfig'
const API_URL = 'http://192.168.1.130:5000'; 

const screenWidth = Dimensions.get("window").width;

// ---------------- DICTIONARY ----------------
const DEFINITIONS = {
  "Revenue": "Total money you have invoiced this client so far.",
  "Real Hourly Rate": "Your 'True' wage. (Total Revenue / Total Hours). Low rate = you are undercharging or working too slowly.",
  "Friction Score": "The % of time spent on unpaid tasks (emails, meetings). If > 20%, this client is high maintenance.",
  "Trend Forecast": "AI Prediction: Based on your work history, this is how long your NEXT task for this client will likely take.",
  "Billable": "Deep Work. Time you are actually charging for (coding, designing).",
  "Admin": "Unpaid Work. Emails, calls, invoicing. This 'costs' you money."
};

// ---------------- AUTH SCREEN COMPONENT ----------------
const AuthScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    if(!username || !password) return Alert.alert("Error", "Please fill in all fields");
    
    const endpoint = isRegistering ? '/register' : '/login';
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, { username, password });
      
      if (isRegistering) {
        Alert.alert("Success", "Account created! Please log in.");
        setIsRegistering(false); 
      } else {
        onLogin(response.data.token);
      }
    } catch (error) {
      const msg = error.response ? error.response.data.message : "Could not connect to server";
      Alert.alert("Error", msg);
    }
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>Freelance Profit Engine 🔐</Text>
      <View style={styles.authBox}>
        <Text style={styles.authHeader}>{isRegistering ? 'Create Account' : 'Welcome Back'}</Text>
        
        <Text style={styles.label}>Username</Text>
        <TextInput 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername} 
            autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleAuth}>
            <Text style={styles.submitBtnText}>{isRegistering ? 'Register' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.switchAuthText}>
                {isRegistering ? "Already have an account? Login" : "New here? Register"}
            </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ---------------- MAIN APP COMPONENT ----------------
export default function App() {
  const [token, setToken] = useState(null); // The Key to the API
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'add'
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [clientMode, setClientMode] = useState('existing');
  const [client, setClient] = useState('');
  const [hours, setHours] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Billable'); 

  // Modals
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [activeDefinition, setActiveDefinition] = useState({ title: '', text: '' });
  
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState({ time: [], income: [] });
  const [editingLog, setEditingLog] = useState(null);
  const [editValue, setEditValue] = useState('');

  // 1. Fetch Data whenever view or token changes
  useEffect(() => {
    if (token) fetchDashboard();
  }, [view, historyModalVisible, token]);

  const getHeaders = () => ({ headers: { 'x-access-token': token } });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/dashboard`, getHeaders());
      setDashboardData(response.data);
    } catch (error) { 
        if(error.response && error.response.status === 401) logout(); 
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
      setToken(null);
      setDashboardData([]);
      setView('dashboard');
  };

  // --- ACTIONS ---

  const handleSubmit = async () => {
    if (!client) return Alert.alert("Missing Info", "Please select or enter a client name.");
    
    try {
      if (hours) await axios.post(`${API_URL}/add-time`, { Client: client, Hours: parseFloat(hours), Type: type }, getHeaders());
      if (amount) await axios.post(`${API_URL}/add-income`, { Client: client, Amount: parseFloat(amount) }, getHeaders());
      
      Alert.alert("Success", "Log Saved!");
      // Reset Form
      setClient(''); setHours(''); setAmount(''); setClientMode('existing');
      setView('dashboard');
    } catch (error) { Alert.alert("Error", "Request failed"); }
  };

  const openHistory = async (clientName) => {
    try {
      const response = await axios.get(`${API_URL}/client-history?client=${clientName}`, getHeaders());
      setSelectedClientHistory(response.data);
      setHistoryModalVisible(true);
    } catch (error) { Alert.alert("Error", "Could not fetch history"); }
  };

  const submitEdit = async () => {
    try {
      await axios.post(`${API_URL}/update-log`, {
        type: editingLog.type,
        id: editingLog.id,
        field: editingLog.field,
        value: parseFloat(editValue)
      }, getHeaders());
      
      setEditingLog(null);
      // Refresh History List
      const clientName = selectedClientHistory.time.length > 0 ? selectedClientHistory.time[0].Client : 
                         selectedClientHistory.income.length > 0 ? selectedClientHistory.income[0].Client : "";
      if(clientName) openHistory(clientName);
      
      Alert.alert("Updated", "Record corrected.");
    } catch (error) { Alert.alert("Error", "Update failed"); }
  };

  // --- RENDER HELPERS ---

  const showHelp = (term) => {
    setActiveDefinition({ title: term, text: DEFINITIONS[term] });
    setInfoModalVisible(true);
  };

  const HelpBtn = ({ term }) => (
    <TouchableOpacity onPress={() => showHelp(term)} style={styles.helpIcon}>
        <Text style={styles.helpText}>i</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.welcomeTitle}>Welcome! 👋</Text>
      <Text style={styles.welcomeText}>
        You don't have any data yet. Let's calculate your true hourly rate.
      </Text>
      
      {/* Ghost Chart */}
      <View style={[styles.chartContainer, {opacity: 0.5}]}>
         <Text style={styles.sectionTitle}>Global Efficiency</Text>
         <View style={{height: 180, justifyContent:'center', alignItems:'center'}}>
            <View style={{width: 120, height: 120, borderRadius: 60, borderWidth: 15, borderColor: '#dfe6e9'}} />
            <Text style={{position:'absolute', color:'#b2bec3', fontWeight:'bold'}}>No Data</Text>
         </View>
      </View>

      <Text style={styles.instructionText}>
        👇 Tap the <Text style={{fontWeight:'bold', color:'#0984e3'}}>+ button</Text> below to add your first client!
      </Text>
    </View>
  );

  const renderDashboardItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.Client}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => openHistory(item.Client)}>
            <Text style={styles.editBtnText}>✎ History</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
         <Text style={styles.rhr}>${item.Real_Hourly_Rate.toFixed(0)}/hr</Text>
         <HelpBtn term="Real Hourly Rate"/>
      </View>

      <View style={styles.predictionBadge}>
        <Text style={{fontSize: 16}}>🤖</Text>
        <Text style={styles.predictionText}>Forecast: Next task ~{item.Forecast_Next_Hour} hrs</Text>
        <HelpBtn term="Trend Forecast"/>
      </View>

      <View style={styles.statsRow}>
        <View style={{alignItems:'center'}}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>${item.Revenue}</Text>
        </View>
        <View style={{alignItems:'center'}}>
            <Text style={styles.statLabel}>Total Hours</Text>
            <Text style={styles.statValue}>{item.Total_Hours}</Text>
        </View>
      </View>

      <View style={styles.frictionContainer}>
         <View style={{flexDirection:'row', justifyContent:'space-between'}}>
             <Text style={styles.statLabel}>Friction Score <HelpBtn term="Friction Score"/></Text>
             <Text style={styles.frictionText}>{item.Friction_Score.toFixed(0)}%</Text>
         </View>
         <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.Friction_Score}%`, backgroundColor: item.Friction_Score > 20 ? '#ff4d4d' : '#4caf50' }]} />
         </View>
      </View>
    </View>
  );

  // --- CHART DATA PREP ---
  const totalAdmin = dashboardData.reduce((acc, curr) => acc + (curr.Admin_Hours || 0), 0);
  const totalTotal = dashboardData.reduce((acc, curr) => acc + (curr.Total_Hours || 0), 0);
  
  const chartData = [
    { name: "Billable", population: totalTotal - totalAdmin, color: "#4caf50", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Friction", population: totalAdmin, color: "#ff4d4d", legendFontColor: "#7F7F7F", legendFontSize: 12 }
  ];

  // --- APP RENDER START ---
  if (!token) {
      return <AuthScreen onLogin={setToken} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Freelance Profit Engine</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
      </View>

      {/* --- MODAL: INFO / HELP --- */}
      <Modal animationType="fade" transparent={true} visible={infoModalVisible} onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{activeDefinition.title}</Text>
            <Text style={styles.modalText}>{activeDefinition.text}</Text>
            <Pressable style={styles.modalBtn} onPress={() => setInfoModalVisible(false)}><Text style={styles.modalBtnText}>Got it</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: HISTORY / EDIT --- */}
      <Modal animationType="slide" visible={historyModalVisible} onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>History & Edit</Text>
                <TouchableOpacity onPress={() => setHistoryModalVisible(false)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
            </View>

            {/* Edit Form (Only visible when editing) */}
            {editingLog && (
                <View style={styles.editForm}>
                    <Text style={styles.label}>Update Value:</Text>
                    <TextInput style={styles.input} value={editValue} onChangeText={setEditValue} keyboardType="numeric" autoFocus/>
                    <View style={{flexDirection:'row', gap:10}}>
                         <TouchableOpacity style={[styles.submitBtn, {flex:1, padding:12}]} onPress={submitEdit}><Text style={styles.submitBtnText}>Update</Text></TouchableOpacity>
                         <TouchableOpacity style={[styles.cancelBtn, {flex:1, marginTop:0}]} onPress={() => setEditingLog(null)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            )}

            <ScrollView>
                <Text style={styles.sectionTitle}>Time Logs</Text>
                {selectedClientHistory.time.map(log => (
                    <View key={log.id} style={styles.logRow}>
                        <Text style={styles.logText}>{log.Hours} hrs ({log.Type})</Text>
                        <TouchableOpacity onPress={() => { setEditingLog({type:'time', id:log.id, field:'Hours'}); setEditValue(log.Hours.toString()); }}>
                            <Text style={styles.editText}>✎</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                 <Text style={[styles.sectionTitle, {marginTop:20}]}>Income Logs</Text>
                {selectedClientHistory.income.map(log => (
                    <View key={log.id} style={styles.logRow}>
                        <Text style={styles.logText}>${log.Amount}</Text>
                        <TouchableOpacity onPress={() => { setEditingLog({type:'income', id:log.id, field:'Amount'}); setEditValue(log.Amount.toString()); }}>
                            <Text style={styles.editText}>✎</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
      </Modal>

      {/* --- DASHBOARD VIEW --- */}
      {view === 'dashboard' ? (
        <ScrollView style={styles.content}>
           {loading && <ActivityIndicator size="large" color="#0984e3" />}
           
           {/* Empty State Logic */}
           {!loading && dashboardData.length === 0 ? (
               renderEmptyState() 
           ) : (
             <>
               {totalTotal > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.sectionTitle}>Global Efficiency</Text>
                  <PieChart 
                    data={chartData} 
                    width={screenWidth - 60} 
                    height={200} 
                    chartConfig={{color:()=>`#000`}} 
                    accessor={"population"} 
                    backgroundColor={"transparent"} 
                    paddingLeft={"15"} 
                    absolute 
                  />
                  <Text style={styles.chartCaption}>Green = Billable | Red = Unpaid Admin</Text>
                </View>
               )}
               <Text style={styles.sectionTitle}>Your Clients</Text>
               {dashboardData.map((item) => <View key={item.Client}>{renderDashboardItem({item})}</View>)}
               <View style={{height: 100}} /> 
             </>
           )}
        </ScrollView>
      ) : (
        /* --- ADD NEW LOG VIEW --- */
        <ScrollView style={styles.content}>
             <Text style={styles.formTitle}>Add New Log</Text>
             
             {/* Client Selection */}
             <Text style={styles.label}>1. Select Client</Text>
             <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, clientMode==='existing' && styles.toggleBtnActive]} onPress={()=>setClientMode('existing')}><Text style={styles.toggleText}>Existing</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, clientMode==='new' && styles.toggleBtnActive]} onPress={()=>{setClientMode('new');setClient('')}}><Text style={styles.toggleText}>+ New</Text></TouchableOpacity>
             </View>
             
             {clientMode === 'existing' ? (
                <View style={styles.chipContainer}>
                    {dashboardData.map(c => (
                        <TouchableOpacity key={c.Client} style={[styles.chip, client===c.Client && styles.chipActive]} onPress={()=>setClient(c.Client)}>
                            <Text style={client===c.Client?styles.chipTextActive:styles.chipText}>{c.Client}</Text>
                        </TouchableOpacity>
                    ))}
                    {dashboardData.length === 0 && <Text style={{color:'#636e72', fontStyle:'italic'}}>No clients yet. Switch to "+ New"</Text>}
                </View>
             ) : (
                <TextInput style={styles.input} value={client} onChangeText={setClient} placeholder="Enter Client Name" autoFocus={true}/>
             )}

             <View style={styles.divider} />

             {/* Time Log */}
             <View style={styles.sectionBox}>
                <Text style={styles.boxTitle}>🕒 Log Time</Text>
                <Text style={styles.label}>Hours Worked</Text>
                <TextInput style={styles.input} value={hours} onChangeText={setHours} keyboardType="numeric" placeholder="0.0"/>
                <View style={styles.typeRow}>
                    <TouchableOpacity style={[styles.typeBtn, type === 'Billable' && styles.typeBtnActive]} onPress={() => setType('Billable')}>
                        <Text style={styles.typeText}>Billable</Text>
                        <HelpBtn term="Billable" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.typeBtn, type === 'Admin' && styles.typeBtnActive]} onPress={() => setType('Admin')}>
                        <Text style={styles.typeText}>Admin</Text>
                        <HelpBtn term="Admin" />
                    </TouchableOpacity>
                </View>
             </View>

             {/* Income Log */}
             <View style={styles.sectionBox}>
                <Text style={styles.boxTitle}>💰 Log Invoice</Text>
                <Text style={styles.label}>Amount Invoiced ($)</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00"/>
             </View>
             
             <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}><Text style={styles.submitBtnText}>Save Entry</Text></TouchableOpacity>
             <TouchableOpacity style={styles.cancelBtn} onPress={()=>setView('dashboard')}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
        </ScrollView>
      )}

      {view === 'dashboard' && <TouchableOpacity style={styles.fab} onPress={() => setView('add')}><Text style={styles.fabText}>+</Text></TouchableOpacity>}
    </View>
  );
}

// ---------------- STYLESHEET ----------------
const styles = StyleSheet.create({
  // Global Layout
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { flex: 1, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#1e272e', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 5 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { position: 'absolute', right: 20, bottom: 20 },
  logoutText: { color: '#ff7675', fontWeight: 'bold' },

  // Auth Screen
  authContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#2d3436' },
  authTitle: { fontSize: 28, color: '#fff', textAlign: 'center', marginBottom: 30, fontWeight: 'bold' },
  authBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  authHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  switchAuthText: { marginTop: 15, textAlign: 'center', color: '#0984e3' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 20 },
  welcomeTitle: { fontSize: 26, fontWeight: 'bold', color: '#2d3436', marginBottom: 10 },
  welcomeText: { fontSize: 16, color: '#636e72', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  instructionText: { fontSize: 18, color: '#2d3436', textAlign: 'center', marginTop: 30, paddingHorizontal: 20 },

  // Dashboard Cards
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  clientName: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  rhr: { fontSize: 18, fontWeight: 'bold', color: '#00b894' },
  
  // Badges & Stats
  predictionBadge: { backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  predictionText: { color: '#1565c0', fontWeight: '600', marginLeft: 8, fontSize: 13, flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f2f6' },
  statLabel: { color: '#636e72', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#2d3436', fontWeight: 'bold', fontSize: 16 },
  
  // Progress Bar
  frictionContainer: { marginTop: 5 },
  progressBarBg: { height: 8, backgroundColor: '#dfe6e9', borderRadius: 4, marginVertical: 8 },
  progressBarFill: { height: 8, borderRadius: 4 },
  frictionText: { fontSize: 14, fontWeight: 'bold', color: '#636e72' },

  // Buttons & Inputs
  editBtn: { backgroundColor: '#dfe6e9', padding: 6, paddingHorizontal: 12, borderRadius: 15 },
  editBtnText: { fontSize: 12, fontWeight: 'bold', color: '#636e72' },
  submitBtn: { backgroundColor: '#0984e3', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#636e72', fontSize: 16 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#dfe6e9', fontSize: 16 },
  label: { marginBottom: 8, color: '#636e72', fontWeight: '600' },

  // Form Toggles
  toggleRow: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#dfe6e9', borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { color: '#2d3436', fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#dfe6e9', borderRadius: 20, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#0984e3' },
  chipText: { color: '#636e72' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  // Layout Boxes
  sectionBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#dfe6e9' },
  boxTitle: { fontWeight: 'bold', marginBottom: 15, color: '#2d3436' },
  divider: { height: 1, backgroundColor: '#dfe6e9', marginVertical: 10 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#dfe6e9', alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  typeBtnActive: { borderColor: '#0984e3', backgroundColor: '#e3f2fd' },
  typeText: { color: '#2d3436', fontSize: 14, fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#2d3436' },
  modalText: { fontSize: 16, color: '#636e72', lineHeight: 24, marginBottom: 20 },
  modalBtn: { backgroundColor: '#0984e3', padding: 10, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
  
  // History Modal Specifics
  historyContainer: { flex: 1, backgroundColor: '#fff', padding: 20, marginTop: 50, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 22, fontWeight: 'bold' },
  closeText: { fontSize: 18, color: '#0984e3' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  logText: { fontSize: 16 },
  editText: { fontSize: 20, color: '#0984e3' },
  editForm: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 10, marginBottom: 20 },

  // Misc
  helpIcon: { marginLeft: 5, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#b2bec3', justifyContent: 'center', alignItems: 'center' },
  helpText: { fontSize: 12, color: '#636e72', fontWeight: 'bold' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 20, elevation: 2, alignItems: 'center' },
  chartCaption: { fontSize: 12, color: '#636e72', marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3436', marginBottom: 15, marginTop: 10 },
  formTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2d3436' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#0984e3', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#0984e3', shadowOpacity: 0.4, shadowRadius: 10 },
  fabText: { color: '#fff', fontSize: 32, marginTop: -4 }
});