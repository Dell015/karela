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
    }
})