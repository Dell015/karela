import { StyleSheet, Dimensions,} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
        elevation: 5,
        
    },
    buttonText: {
        color: 'white', // Give the text a color so it stands out
        fontWeight: 'bold',
        fontSize: 16,
    },
    stopBtn: {
        backgroundColor: "#7CF205",
    },
    startBtn: {
        backgroundColor: '#007AFF',
    },
    handleStop: {

    },
    handleStart: {

    },

})