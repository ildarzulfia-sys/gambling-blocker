const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

function withVpnService(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    if (!application.service) {
      application.service = [];
    }

    const hasVpnService = application.service.some(
      (s) => s['$']['android:name'] === '.VpnBlockerService'
    );

    if (!hasVpnService) {
      application.service.push({
        $: {
          'android:name': '.VpnBlockerService',
          'android:permission': 'android.permission.BIND_VPN_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.net.VpnService',
                },
              },
            ],
          },
        ],
      });
    }

    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const hasInternetPermission = manifest.manifest['uses-permission'].some(
      (p) => p['$']['android:name'] === 'android.permission.INTERNET'
    );

    if (!hasInternetPermission) {
      manifest.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.INTERNET' },
      });
    }

    return config;
  });

  return config;
}

module.exports = withVpnService;
