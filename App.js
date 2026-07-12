import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';

export default function App() {
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [blockedToday, setBlockedToday] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gambling Blocker</Text>
      <Text style={styles.subtitle}>Защита активна</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Статус защиты</Text>
        <Switch
          value={protectionEnabled}
          onValueChange={setProtectionEnabled}
          disabled={true}
        />
        <Text style={styles.hint}>
          Отключение доступно через 48 часов после запроса
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Заблокировано сегодня</Text>
        <Text style={styles.counter}>{blockedToday}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#4ade80',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  counter: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f87171',
  },
});
