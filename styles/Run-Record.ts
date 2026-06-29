import { StyleSheet } from "react-native";
import { KARELA } from "./designSystem";

export const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: KARELA.color.bg, 
        alignItems: "center", 
        justifyContent: "center",
    },
    
    header: { 
        color: KARELA.color.textPrimary, 
        fontSize: 28, 
        fontFamily: KARELA.font.bold, 
        marginBottom: KARELA.space.xxxl,
    },

    dashboard: { 
        backgroundColor: KARELA.color.surface, 
        padding: 30, 
        borderRadius: KARELA.radius.lg, 
        width: "80%", 
        marginBottom: KARELA.space.xxxl,
    },

    label: { 
        color: KARELA.color.brand, 
        fontSize: KARELA.space.xl, 
        fontFamily: KARELA.font.medium, 
        marginVertical: 10,
    },

    btn: { 
        width: "80%", 
        padding: KARELA.space.xl, 
        borderRadius: KARELA.radius.pill, 
        alignItems: "center",
    },

    startBtn: { 
        backgroundColor: KARELA.color.brand,
    },

    stopBtn: { 
        backgroundColor: KARELA.color.danger,
    },

    btnText: { 
        fontFamily: KARELA.font.bold, 
        fontSize: KARELA.size.h2,
    },
});
