import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const COLORS = {
  bgPhone: '#0e1226',
  card: '#161a35',
  card2: '#1b2040',
  border: '#262b4d',
  teal: '#5ee0c9',
  tealDim: '#37b6a0',
  amber: '#f2ad74',
  textPrimary: '#f3f5fb',
  textSecondary: '#8b90ac',
  textTertiary: '#5c6182',
};

const LOCK_OPTIONS = [
  { label: '30 дней', tag: 'минимум', days: 30 },
  { label: '6 месяцев', tag: 'рекомендуем', days: 182 },
  { label: '1 год', tag: '', days: 365 },
  { label: '5 лет', tag: 'максимум', days: 1825 },
];

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ progress, centerNumber, centerLabel, active }) {
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  return (
    <View style={styles.ringWrap}>
      <Svg width={104} height={104} viewBox="0 0 104 104">
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={COLORS.teal} />
            <Stop offset="100%" stopColor={COLORS.tealDim} />
          </LinearGradient>
        </Defs>
        <Circle
          cx="52"
          cy="52"
          r={RING_RADIUS}
          stroke="#242849"
          strokeWidth="8"
          fill="none"
        />
        <Circle
          cx="52"
          cy="52"
          r={RING_RADIUS}
          stroke={active ? 'url(#ringGrad)' : '#3a3f66'}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          rotation="-90"
          origin="52,52"
        />
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.ringCenterNum}>{centerNumber}</Text>
        <Text style={styles.ringCenterLabel}>{centerLabel}</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [lockDays, setLockDays] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [durationVisible, setDurationVisible] = useState(false);
  const [confirmOption, setConfirmOption] = useState(null);

  const [blockedToday, setBlockedToday] = useState(3);
  const [blockedWeek, setBlockedWeek] = useState(17);

  const [recentActivity, setRecentActivity] = useState([
    { domain: '1xbet-mirror.com', time: '14:32' },
    { domain: 'melbet-kz.net', time: '11:05' },
    { domain: 'zhastar-casino.kz', time: '09:47' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isLocked = lockUntil !== null && now < lockUntil;

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const daysRemaining = isLocked
    ? Math.max(0, Math.ceil((lockUntil - now) / (24 * 60 * 60 * 1000)))
    : 0;

  const ringProgress = isLocked
    ? Math.min(1, 1 - (lockUntil - now) / (lockDays * 24 * 60 * 60 * 1000))
    : 0;

  const openDurationPicker = () => {
    if (isLocked) return;
    setDurationVisible(true);
  };

  const pickDuration = (option) => {
    setDurationVisible(false);
    setConfirmOption(option);
  };

  const confirmLock = () => {
    if (!confirmOption) return;
    const until = Date.now() + confirmOption.days * 24 * 60 * 60 * 1000;
    setLockUntil(until);
    setLockDays(confirmOption.days);
    setProtectionEnabled(true);
    setConfirmOption(null);
  };

  const simulateBlock = () => {
    const fakeDomains = [
      'vulkan-royal.kz',
      'top-kazik8.sovz.kz',
      'joycasino-play.net',
      'pin-up-bet.info',
      'lev-casino.online',
    ];
    const domain = fakeDomains[Math.floor(Math.random() * fakeDomains.length)];
    const time = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setBlockedToday((prev) => prev + 1);
    setBlockedWeek((prev) => prev + 1);
    setRecentActivity((prev) => [{ domain, time }, ...prev].slice(0, 5));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPhone} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Gambling Blocker</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: protectionEnabled ? COLORS.teal : COLORS.textTertiary },
                ]}
              />
              <Text
                style={[
                  styles.subtitle,
                  { color: protectionEnabled ? COLORS.teal : COLORS.textSecondary },
                ]}
              >
                {protectionEnabled ? 'Защита активна' : 'Защита отключена'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ring card */}
        <View
          style={[
            styles.ringCard,
            isLocked && {
              borderColor: 'rgba(94,224,201,0.25)',
            },
          ]}
        >
          <View style={styles.ringRow}>
            <ProgressRing
              progress={isLocked ? ringProgress : 0}
              active={isLocked}
              centerNumber={isLocked ? daysRemaining : '—'}
              centerLabel={isLocked ? 'дней осталось' : 'не активно'}
            />
            <View style={styles.ringInfo}>
              <Text style={styles.ringLabel}>
                {isLocked ? 'Обязательство принято' : 'Статус'}
              </Text>
              <Text style={styles.ringValue}>
                {isLocked ? `До ${formatDate(lockUntil)}` : 'Защита выключена'}
              </Text>
              <Text style={styles.ringHint}>
                {isLocked
                  ? `Вы выбрали ${confirmOption ? confirmOption.label.toLowerCase() : `${lockDays} дней`}. Отменить это решение нельзя — это и есть весь смысл.`
                  : 'Выберите срок и включите — до конца срока отключить будет нельзя.'}
              </Text>
            </View>
          </View>

          <View style={styles.ctaRow}>
            {isLocked ? (
              <View style={styles.btnLocked}>
                <Text style={styles.btnLockedText}>🔒 Отключение недоступно</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnPrimary} onPress={openDurationPicker}>
                <Text style={styles.btnPrimaryText}>Включить защиту</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: COLORS.amber }]}>{blockedToday}</Text>
            <Text style={styles.statLabel}>сегодня</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{blockedWeek}</Text>
            <Text style={styles.statLabel}>за неделю</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>200k+</Text>
            <Text style={styles.statLabel}>в базе</Text>
          </View>
        </View>

        {/* Activity */}
        <View style={styles.card}>
          <View style={styles.cardRowBetween}>
            <Text style={styles.cardTitle}>Последние блокировки</Text>
            <TouchableOpacity onPress={simulateBlock} style={styles.testButton}>
              <Text style={styles.testButtonText}>+ тест</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.length === 0 ? (
            <Text style={styles.cardHint}>Пока ничего не заблокировано</Text>
          ) : (
            recentActivity.map((item, index) => (
              <View key={index} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <Text style={styles.activityDomain} numberOfLines={1}>
                  {item.domain}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.footer}>
          Приложение не позволяет досрочно отключить защиту — это часть
          механизма поддержки в борьбе с лудоманией
        </Text>
      </ScrollView>

      {/* Duration picker sheet */}
      <Modal visible={durationVisible} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>На какой срок?</Text>
            <Text style={styles.sheetSub}>
              Выбранный срок нельзя будет отменить досрочно
            </Text>
            {LOCK_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.days}
                style={styles.optionButton}
                onPress={() => pickDuration(option)}
              >
                <Text style={styles.optionButtonText}>{option.label}</Text>
                {!!option.tag && <Text style={styles.optionTag}>{option.tag}</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setDurationVisible(false)}
            >
              <Text style={styles.cancelLinkText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm sheet */}
      <Modal visible={!!confirmOption} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.warnIcon}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
            </View>
            <Text style={styles.sheetTitle}>Вы уверены?</Text>
            <Text style={styles.sheetSub}>
              После включения отключить защиту будет невозможно{' '}
              {confirmOption ? confirmOption.label.toLowerCase() : ''}. Кнопка
              заблокируется до этой даты.
            </Text>
            <TouchableOpacity
              style={[styles.optionButton, styles.confirmButton]}
              onPress={confirmLock}
            >
              <Text style={[styles.optionButtonText, { textAlign: 'center', flex: 1 }]}>
                Да, включить и заблокировать
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setConfirmOption(null)}
            >
              <Text style={styles.cancelLinkText}>Передумал</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgPhone },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, marginTop: 4 },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  logoEmoji: { fontSize: 20 },
  title: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  subtitle: { fontSize: 12.5, fontWeight: '600' },

  ringCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },
  ringRow: { flexDirection: 'row', alignItems: 'center' },
  ringWrap: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringCenterNum: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  ringCenterLabel: { color: COLORS.textTertiary, fontSize: 9, marginTop: 2 },
  ringInfo: { flex: 1, marginLeft: 16 },
  ringLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  ringValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  ringHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5, lineHeight: 17 },

  ctaRow: { marginTop: 18 },
  btnPrimary: {
    backgroundColor: COLORS.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#08221c', fontSize: 14.5, fontWeight: '700' },
  btnLocked: {
    backgroundColor: '#1a2040',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnLockedText: { color: COLORS.textTertiary, fontSize: 14, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginBottom: 14, gap: 9 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNum: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '700' },
  statLabel: { color: COLORS.textTertiary, fontSize: 10.5, marginTop: 3 },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  cardHint: { color: COLORS.textSecondary, fontSize: 13 },
  testButton: {
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
  },
  testButtonText: { color: COLORS.teal, fontSize: 11.5, fontWeight: '700' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c2040',
  },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.amber, marginRight: 10 },
  activityDomain: { flex: 1, color: '#d7dbee', fontSize: 13 },
  activityTime: { color: COLORS.textTertiary, fontSize: 11, marginLeft: 8 },

  footer: {
    color: COLORS.textTertiary,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    paddingHorizontal: 6,
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,7,16,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#12162e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#33385c',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  warnIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(242,173,116,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,173,116,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  sheetSub: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  optionButton: {
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  optionTag: { color: COLORS.textTertiary, fontSize: 10.5 },
  confirmButton: { backgroundColor: '#c98a54', justifyContent: 'center' },
  cancelLink: { alignItems: 'center', paddingVertical: 10 },
  cancelLinkText: { color: COLORS.textTertiary, fontSize: 13 },
});