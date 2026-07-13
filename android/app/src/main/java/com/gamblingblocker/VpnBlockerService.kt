package com.gamblingblocker

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer
import kotlin.concurrent.thread

class VpnBlockerService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning = false

    companion object {
        const val TAG = "VpnBlockerService"
        var blockedDomains: Set<String> = setOf(
            "1xbet-mirror.com",
            "melbet-kz.net",
            "zhastar-casino.kz",
            "top-kazik8.sovz.kz",
            "vulkan-royal.kz",
            "joycasino-play.net",
            "pin-up-bet.info",
            "lev-casino.online"
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            startVpn()
        }
        return START_STICKY
    }

    private fun startVpn() {
        val builder = Builder()
            .setSession("Gambling Blocker")
            .addAddress("10.0.0.2", 32)
            .addDnsServer("1.1.1.1")
            .addRoute("0.0.0.0", 0)

        vpnInterface = builder.establish()
        isRunning = true

        thread {
            runVpnLoop()
        }
    }

    private fun runVpnLoop() {
        val fd = vpnInterface ?: return
        val input = FileInputStream(fd.fileDescriptor)
        val output = FileOutputStream(fd.fileDescriptor)
        val buffer = ByteArray(32767)

        try {
            while (isRunning) {
                val length = input.read(buffer)
                if (length > 0) {
                    val packet = buffer.copyOf(length)
                    val domain = extractDnsDomain(packet)

                    if (domain != null && isBlocked(domain)) {
                        Log.d(TAG, "Blocked domain: $domain")
                        // Drop the packet - do not forward it
                        continue
                    }

                    output.write(packet, 0, packet.size)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "VPN loop error: ${e.message}")
        }
    }

    private fun isBlocked(domain: String): Boolean {
        val lower = domain.lowercase()
        return blockedDomains.any { blocked ->
            lower == blocked || lower.endsWith(".$blocked")
        }
    }

    private fun extractDnsDomain(packet: ByteArray): String? {
        try {
            if (packet.size < 20) return null
            val ipHeaderLength = (packet[0].toInt() and 0x0F) * 4
            if (packet.size < ipHeaderLength + 8) return null

            val protocol = packet[9].toInt()
            if (protocol != 17) return null // Only UDP (DNS uses UDP)

            val udpStart = ipHeaderLength
            val destPort = ((packet[udpStart + 2].toInt() and 0xFF) shl 8) or
                    (packet[udpStart + 3].toInt() and 0xFF)

            if (destPort != 53) return null // Only DNS port

            val dnsStart = udpStart + 8
            var pos = dnsStart + 12 // Skip DNS header
            val domain = StringBuilder()

            while (pos < packet.size) {
                val len = packet[pos].toInt() and 0xFF
                if (len == 0) break
                pos++
                if (pos + len > packet.size) return null
                if (domain.isNotEmpty()) domain.append(".")
                domain.append(String(packet, pos, len, Charsets.US_ASCII))
                pos += len
            }

            return if (domain.isNotEmpty()) domain.toString() else null
        } catch (e: Exception) {
            return null
        }
    }

    override fun onDestroy() {
        isRunning = false
        vpnInterface?.close()
        super.onDestroy()
    }
}
