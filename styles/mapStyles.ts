import { Dimensions, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    map: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    }, 

     marker: {
        width: 20,
        height: 20,
        borderRadius: 20,
        backgroundColor: "#7CF205",
        borderWidth: 3,
        borderColor: "#fff",
        // Add elevation so the dot stands out on the map
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    
    ghostMarker: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "rgba(32, 159, 119, 1)", // Translucent white
        borderWidth: 2,
        borderColor: "#fff", // Dimmed grey border
    },

    backButton: {
        position: 'absolute',
        top: 50,           // Adjust this based on your phone's notch
        left: 20,
        backgroundColor: '#7CF205', // Your signature Neon Green
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow for "Floating" effect
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
})