import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>That door is not on the floor.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Return to the lobby</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12060c', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#f0d78c', fontSize: 22, textAlign: 'center' },
  link: { marginTop: 16 },
  linkText: { color: '#fbf6ea', fontSize: 16 },
});
