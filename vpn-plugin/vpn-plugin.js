const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withVpnService(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    if (!application.service) {
      application.service = [];
    }

    const alreadyExists = application.service.some(
      (s) => s.$['android:name'] === '.VpnBlockerService'
    );

    if (!alreadyExists) {
      application.service.push({
        $: {
          'android:name': '.VpnBlockerService',
          'android:permission': 'android.permission.BIND_VPN_SERVICE',
          'android:exported': 'false',
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

    return config;
  });
};
