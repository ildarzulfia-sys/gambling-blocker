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
        var blockedDomains: Set<String> = emptySet()
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
                    // Basic passthrough - real DNS filtering logic
                    // would inspect packet here and drop blocked domains
                    output.write(buffer, 0, length)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "VPN loop error: ${e.message}")
        }
    }

    override fun onDestroy() {
        isRunning = false
        vpnInterface?.close()
        super.onDestroy()
    }
}
