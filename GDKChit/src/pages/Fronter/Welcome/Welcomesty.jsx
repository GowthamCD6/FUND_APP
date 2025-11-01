import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
    },
      container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
    title: {
        fontFamily: "DMSans-Regular",
        color: "#4A5E6D",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 20,
    },
    image: {
        resizeMode: "contain",
        alignSelf: "center",
    },
    mainText: {
        color: "black",
        letterSpacing: 1,
        fontSize: 25,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 20,
    },
    text2: {
        color: "black",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 1,
        textAlign: "center",
        marginTop: 10,
        paddingHorizontal: 20,
        
    },
    btn: {
        width: 211,
        height: 40,
        justifyContent: "center",
        backgroundColor: "#2842C4",
        borderRadius: 8,
    },
    btntext: {
        color: "white",
        fontSize: 18,
        textAlign: "center",
        fontWeight: "bold",

    },
    pressablebtn: {
        marginTop: 30,
        alignSelf: "center",
    },
});

export default styles;
