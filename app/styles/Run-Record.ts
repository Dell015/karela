import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#121212', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    
    header: { 
        color: '#fff', 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 40 
    },

    dashboard: { 
        backgroundColor: '#1e1e1e', 
        padding: 30, 
        borderRadius: 20, 
        width: '80%', 
        marginBottom: 40 },

    label: { 
        color: '#00FF00', 
        fontSize: 20, 
        fontFamily: 'monospace', 
        marginVertical: 10 },

    btn: { 
        width: '80%', 
        padding: 20, 
        borderRadius: 50, 
        alignItems: 'center' },

    startBtn: { 
        backgroundColor: '#00FF00' },

    stopBtn: { 
        backgroundColor: '#FF3B30' },

    btnText: { 
        fontWeight: 'bold', 
        fontSize: 18 }
})