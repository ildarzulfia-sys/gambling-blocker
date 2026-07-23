package com.gamblingblocker

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress
import kotlin.concurrent.thread

class VpnBlockerService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning = false

    companion object {
        const val TAG = "VpnBlockerService"
        var blockedDomains: Set<String> = setOf(
            "pinco.com",
            "pinco.bet",
            "pinco1.com",
            "pinco-casino.com",
            "pinco-kz.com",
            "pincocasino.com",
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

    override fun onDestroy() {
        isRunning = false
        vpnInterface?.close()
        super.onDestroy()
    }

    private fun startVpn() {
        val builder = Builder()
            .setSession("Gambling Blocker")
            .addAddress("10.0.0.2", 32)
            .addDnsServer("10.0.0.1")
            .addRoute("10.0.0.1", 32)
            .setMtu(1500)

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
                    handlePacket(packet, output)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "VPN loop error: ${e.message}")
        }
    }

    private fun handlePacket(packet: ByteArray, output: FileOutputStream) {
        try {
            if (packet.size < 28) return
            val ipHeaderLength = (packet[0].toInt() and 0x0F) * 4
            val protocol = packet[9].toInt()
            if (protocol != 17) return

            val udpStart = ipHeaderLength
            val destPort = ((packet[udpStart + 2].toInt() and 0xFF) shl 8) or
                    (packet[udpStart + 3].toInt() and 0xFF)
            if (destPort != 53) return

            val dnsStart = udpStart + 8
            val domain = extractDnsDomain(packet, dnsStart) ?: return

            if (isBlocked(domain)) {
                Log.d(TAG, "Blocked domain: $domain")
                return
            }

            val response = queryRealDns(packet, dnsStart)
            if (response != null) {
                val replyPacket = buildReplyPacket(packet, ipHeaderLength, response)
                output.write(replyPacket)
            }
        } catch (e: Exception) {
            Log.e(TAG, "handlePacket error: ${e.message}")
        }
    }

    private fun isBlocked(domain: String): Boolean {
        val lower = domain.lowercase()
        return blockedDomains.any { blocked ->
            lower == blocked || lower.endsWith(".$blocked")
        }
    }

    private fun extractDnsDomain(packet: ByteArray, dnsStart: Int): String? {
        try {
            var pos = dnsStart + 12
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

    private fun queryRealDns(packet: ByteArray, dnsStart: Int): ByteArray? {
        return try {
            val dnsPayload = packet.copyOfRange(dnsStart, packet.size)
            val socket = DatagramSocket()
            protect(socket)
            socket.soTimeout = 4000

            val upstream = InetSocketAddress("8.8.8.8", 53)
            socket.send(DatagramPacket(dnsPayload, dnsPayload.size, upstream))

            val responseBuffer = ByteArray(1024)
            val responsePacket = DatagramPacket(responseBuffer, responseBuffer.size)
            socket.receive(responsePacket)
            socket.close()

            responsePacket.data.copyOf(responsePacket.length)
        } catch (e: Exception) {
            Log.e(TAG, "queryRealDns error: ${e.message}")
            null
        }
    }

    private fun buildReplyPacket(original: ByteArray, ipHeaderLength: Int, dnsResponse: ByteArray): ByteArray {
        val udpHeaderLength = 8
        val totalLength = ipHeaderLength + udpHeaderLength + dnsResponse.size
        val reply = ByteArray(totalLength)

        System.arraycopy(original, 0, reply, 0, ipHeaderLength)
        for (i in 0 until 4) {
            reply[12 + i] = original[16 + i]
            reply[16 + i] = original[12 + i]
        }
        reply[9] = 17
        val totalLenBytes = shortToBytes(totalLength)
        reply[2] = totalLenBytes[0]
        reply[3] = totalLenBytes[1]
        reply[10] = 0
        reply[11] = 0
        val ipChecksum = checksum(reply, 0, ipHeaderLength)
        val ipChecksumBytes = shortToBytes(ipChecksum)
        reply[10] = ipChecksumBytes[0]
        reply[11] = ipChecksumBytes[1]

        val udpStart = ipHeaderLength
        reply[udpStart] = original[udpStart + 2]
        reply[udpStart + 1] = original[udpStart + 3]
        reply[udpStart + 2] = original[udpStart]
        reply[udpStart + 3] = original[udpStart + 1]
        val udpLenBytes = shortToBytes(udpHeaderLength + dnsResponse.size)
        reply[udpStart + 4] = udpLenBytes[0]
        reply[udpStart + 5] = udpLenBytes[1]
        reply[udpStart + 6] = 0
        reply[udpStart + 7] = 0

        System.arraycopy(dnsResponse, 0, reply, udpStart + udpHeaderLength, dnsResponse.size)

        return reply
    }

    private fun shortToBytes(value: Int): ByteArray {
        return byteArrayOf(((value shr 8) and 0xFF).toByte(), (value and 0xFF).toByte())
    }

    private fun checksum(data: ByteArray, offset: Int, length: Int): Int {
        var sum = 0
        var i = offset
        while (i < offset + length) {
            val word = ((data[i].toInt() and 0xFF) shl 8) or
                    (if (i + 1 < offset + length) (data[i + 1].toInt() and 0xFF) else 0)
            sum += word
            i += 2
        }
        while (sum shr 16 != 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        return sum.inv() and 0xFFFF
    }
}
