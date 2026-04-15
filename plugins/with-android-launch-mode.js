/**
 * Custom Expo config plugin.
 *
 * Sets android:launchMode="singleTask" on the main activity of the
 * generated AndroidManifest.xml. Fixes the React Navigation warning
 * "Looks like you have configured linking in multiple places" which
 * can fire when the OS relaunches the app via deep link and the
 * default launchMode creates a new activity instance.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const LAUNCH_MODE = 'singleTask';

module.exports = function withAndroidLaunchMode(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app || !app.activity) return cfg;

    const mainActivity = app.activity.find(
      (a) => a.$['android:name'] === '.MainActivity',
    );
    if (mainActivity) {
      mainActivity.$['android:launchMode'] = LAUNCH_MODE;
    }
    return cfg;
  });
};
