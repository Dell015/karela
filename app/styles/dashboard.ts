import { StyleSheet } from 'react-native';

export const dashboard_ui = StyleSheet.create({
    headerRow: {
    flexDirection: 'row', // Align children horizontally (Side-by-side)
    justifyContent: 'space-between', // Push children to far left and far right
    alignItems: 'center', // Center them vertically relative to each other
    paddingHorizontal: 20, // Padding on left and right
    paddingVertical: 15,   // Padding on top and bottom
  },
  profileGroup: {
    flexDirection: 'row', // Keep circle and text stack next to each other
    alignItems: 'center',
    gap: 12, // The space between the circle and the text
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25, // Logic: Size / 2 = Perfect Circle
    backgroundColor: '#26A69A', // Your Emerald/Green accent
  },
  textStack: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: '#888', // Grayish sub-text
    fontSize: 14,
    fontFamily: 'System', // You can replace with your 'Excon' font later
  },
  userName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.1)', // Semi-transparent "Glass" effect
    borderRadius: 12,
    justifyContent: 'center', // Center icon horizontally
    alignItems: 'center',     // Center icon vertically
  }
});