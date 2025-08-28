import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AccountD = ({ onBack }) => {
	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.backButton} onPress={onBack}>
				<Text style={styles.backText}>{'< Back'}</Text>
			</TouchableOpacity>
			<Text style={styles.title}>Account Details Page</Text>
			{/* Add your account details content here */}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	backButton: {
		position: 'absolute',
		top: 40,
		left: 20,
		padding: 10,
	},
	backText: {
		fontSize: 16,
		color: '#6B46C1',
		fontWeight: 'bold',
	},
	title: {
		fontSize: 22,
		fontWeight: '600',
		color: '#212121',
		marginTop: 60,
	},
});

export default AccountD;
